from django.utils import timezone
from rest_framework import generics, views, serializers
from rest_framework.response import Response
from .models import TreatmentPlan, TreatmentPlanItem, TreatmentPlanRevisionLog
from .serializers import (
    TreatmentPlanSerializer, TreatmentPlanItemWriteSerializer,
    ConsentActionSerializer, ReviseActionSerializer,
)
from .permissions import TreatmentPlanPermission, IsPatientOwnerForConsent


class TreatmentPlanListCreateView(generics.ListCreateAPIView):
    serializer_class = TreatmentPlanSerializer
    permission_classes = [TreatmentPlanPermission]

    def get_queryset(self):
        return TreatmentPlan.objects.filter(patient_id=self.kwargs["patient_id"]).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs["patient_id"], created_by=self.request.user)


class TreatmentPlanDetailView(generics.RetrieveUpdateAPIView):
    queryset = TreatmentPlan.objects.all()
    serializer_class = TreatmentPlanSerializer
    permission_classes = [TreatmentPlanPermission]

    def perform_update(self, serializer):
        plan = self.get_object()
        if plan.status != "draft":
            raise serializers.ValidationError(
                "This plan has already been proposed. Use the /revise/ endpoint to make changes."
            )
        serializer.save()


class TreatmentPlanItemListCreateView(generics.ListCreateAPIView):
    serializer_class = TreatmentPlanItemWriteSerializer
    permission_classes = [TreatmentPlanPermission]

    def get_queryset(self):
        return TreatmentPlanItem.objects.filter(plan_id=self.kwargs["plan_id"])

    def perform_create(self, serializer):
        plan = TreatmentPlan.objects.get(id=self.kwargs["plan_id"])
        serializer.save(plan=plan)
        plan.recalculate_total()


class TreatmentPlanItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TreatmentPlanItem.objects.all()
    serializer_class = TreatmentPlanItemWriteSerializer
    permission_classes = [TreatmentPlanPermission]

    def perform_update(self, serializer):
        item = serializer.save()
        item.plan.recalculate_total()

    def perform_destroy(self, instance):
        plan = instance.plan
        instance.delete()
        plan.recalculate_total()


class ProposePlanView(views.APIView):
    """Locks the plan and marks it ready for the patient's decision."""
    permission_classes = [TreatmentPlanPermission]

    def post(self, request, pk):
        plan = TreatmentPlan.objects.get(pk=pk)
        self.check_object_permissions(request, plan)
        if plan.items.count() == 0:
            return Response({"detail": "Cannot propose a plan with no items."}, status=400)
        plan.status = "proposed"
        plan.patient_approved_price = plan.total_estimated_cost
        plan.save()
        return Response(TreatmentPlanSerializer(plan).data)


class PatientConsentView(views.APIView):
    """Patient accepts or rejects — this is the one action only the patient can take, not staff."""
    permission_classes = [IsPatientOwnerForConsent]

    def post(self, request, pk):
        plan = TreatmentPlan.objects.get(pk=pk)
        if plan.patient.linked_user_id != request.user.id:
            return Response({"detail": "Not your treatment plan."}, status=403)
        if plan.status != "proposed":
            return Response({"detail": "This plan is not awaiting your decision."}, status=400)

        serializer = ConsentActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan.status = "accepted" if serializer.validated_data["decision"] == "accept" else "rejected"
        plan.consent_signed = serializer.validated_data["decision"] == "accept"
        plan.consent_signed_at = timezone.now()
        plan.patient_signature = serializer.validated_data.get("patient_signature", "")
        plan.save()
        return Response(TreatmentPlanSerializer(plan).data)


class RevisePlanView(views.APIView):
    """Doctor/Chief Doctor change an already-locked plan — mandatory reason, old version logged."""
    permission_classes = [TreatmentPlanPermission]

    def post(self, request, pk):
        plan = TreatmentPlan.objects.get(pk=pk)
        self.check_object_permissions(request, plan)

        serializer = ReviseActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        TreatmentPlanRevisionLog.objects.create(
            plan=plan,
            revision_number=plan.revision_number,
            reason_for_change=serializer.validated_data["reason_for_change"],
            snapshot=TreatmentPlanSerializer(plan).data,
            changed_by=request.user,
        )
        plan.revision_number += 1
        plan.status = "draft"
        plan.consent_signed = False
        plan.consent_signed_at = None
        plan.save()
        return Response(TreatmentPlanSerializer(plan).data)