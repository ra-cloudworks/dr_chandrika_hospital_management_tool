from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from accounts.models import AuditLog
from patients.models import Patient
from .models import DentalLab, LabOrder, LabOrderStatusLog
from .permissions import DentalLabPermission, LabOrderPermission
from .serializers import (
    DentalLabSerializer,
    LabOrderListSerializer,
    LabOrderDetailSerializer,
    LabOrderStatusLogSerializer,
    LabOrderStatusUpdateSerializer,
)


class DentalLabListCreateView(generics.ListCreateAPIView):
    """
    List active/all dental labs or create a new dental lab profile.
    Chief Doctor only for creation; staff for viewing.
    """
    queryset = DentalLab.objects.all().order_by("name")
    serializer_class = DentalLabSerializer
    permission_classes = [DentalLabPermission]

    def perform_create(self, serializer):
        # Save dental lab profile
        instance = serializer.save()

        # Audit log entry for dental lab creation
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="create",
            module="dental_lab",
            record_id=str(instance.id),
            old_value=None,
            new_value=serializer.data,
        )


class DentalLabDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific dental lab profile.
    Chief Doctor only for updates.
    """
    queryset = DentalLab.objects.all()
    serializer_class = DentalLabSerializer
    permission_classes = [DentalLabPermission]

    def perform_update(self, serializer):
        old_data = DentalLabSerializer(self.get_object()).data
        instance = serializer.save()

        # Audit log entry for dental lab update
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="update",
            module="dental_lab",
            record_id=str(instance.id),
            old_value=old_data,
            new_value=serializer.data,
        )


class LabOrderListCreateView(generics.ListCreateAPIView):
    """
    List all lab orders for a specific patient or create a new lab order.
    Scoped by patient_id URL kwarg.
    """
    permission_classes = [LabOrderPermission]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LabOrderDetailSerializer
        return LabOrderListSerializer

    def get_queryset(self):
        patient_id = self.kwargs.get("patient_id")
        queryset = LabOrder.objects.filter(patient_id=patient_id).order_by("-created_at")

        # Optional query filters
        status_param = self.request.query_params.get("status")
        lab_id = self.request.query_params.get("lab_id")
        work_type = self.request.query_params.get("work_type")
        doctor_acceptance = self.request.query_params.get("doctor_acceptance")

        if status_param:
            queryset = queryset.filter(status=status_param)
        if lab_id:
            queryset = queryset.filter(lab_id=lab_id)
        if work_type:
            queryset = queryset.filter(work_type=work_type)
        if doctor_acceptance:
            queryset = queryset.filter(doctor_acceptance=doctor_acceptance)

        return queryset

    def perform_create(self, serializer):
        patient_id = self.kwargs.get("patient_id")
        patient = get_object_or_404(Patient, pk=patient_id)

        # Set patient, created_by, and default ordering_doctor if missing
        ordering_doctor = serializer.validated_data.get("ordering_doctor") or self.request.user

        instance = serializer.save(
            patient=patient,
            created_by=self.request.user,
            ordering_doctor=ordering_doctor,
        )

        # Create initial status log entry (from "" to draft/initial status)
        LabOrderStatusLog.objects.create(
            lab_order=instance,
            old_status="",
            new_status=instance.status,
            changed_by=self.request.user,
            notes="Initial order created.",
        )

        # Audit log entry for lab order creation
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="create",
            module="lab_order",
            record_id=str(instance.id),
            old_value=None,
            new_value=LabOrderDetailSerializer(instance).data,
        )


class LabOrderGlobalListView(generics.ListAPIView):
    """
    Global list of lab orders across all patients for the main lab management dashboard.
    Supports filtering by status, lab_id, work_type, doctor_acceptance.
    """
    serializer_class = LabOrderListSerializer
    permission_classes = [LabOrderPermission]

    def get_queryset(self):
        queryset = LabOrder.objects.all().order_by("-created_at")

        status_param = self.request.query_params.get("status")
        lab_id = self.request.query_params.get("lab_id")
        work_type = self.request.query_params.get("work_type")
        doctor_acceptance = self.request.query_params.get("doctor_acceptance")

        if status_param:
            queryset = queryset.filter(status=status_param)
        if lab_id:
            queryset = queryset.filter(lab_id=lab_id)
        if work_type:
            queryset = queryset.filter(work_type=work_type)
        if doctor_acceptance:
            queryset = queryset.filter(doctor_acceptance=doctor_acceptance)

        return queryset


class LabOrderDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update a specific lab order details.
    Restricted object-level permission for assistants.
    """
    queryset = LabOrder.objects.all()
    serializer_class = LabOrderDetailSerializer
    permission_classes = [LabOrderPermission]

    def perform_update(self, serializer):
        old_data = LabOrderDetailSerializer(self.get_object()).data
        instance = serializer.save()

        # Audit log entry for lab order update
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="update",
            module="lab_order",
            record_id=str(instance.id),
            old_value=old_data,
            new_value=serializer.data,
        )


class LabOrderStatusUpdateView(APIView):
    """
    Dedicated endpoint to update lab order status with validation against VALID_TRANSITIONS.
    Automatically creates status log, audit log, and manages side effects (remake count, delivery date).
    """
    permission_classes = [LabOrderPermission]

    def post(self, request, pk):
        lab_order = get_object_or_404(LabOrder, pk=pk)
        self.check_object_permissions(request, lab_order)

        serializer = LabOrderStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data["new_status"]
        notes = serializer.validated_data.get("notes", "").strip()
        current_status = lab_order.status

        # Validate transition against VALID_TRANSITIONS dict
        allowed_transitions = LabOrder.VALID_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_transitions:
            return Response(
                {
                    "error": f"Invalid status transition from '{current_status}' to '{new_status}'. Allowed transitions: {allowed_transitions}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Require notes if requesting a remake
        if new_status == "remake_requested":
            if not notes:
                return Response(
                    {"error": "Notes are required when requesting a remake (must state reason for remake)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            lab_order.remake_count += 1
            lab_order.remake_reason = notes

        # Auto-set actual_delivery_date if delivered
        if new_status == "delivered":
            lab_order.actual_delivery_date = timezone.now().date()

        # Update doctor acceptance status on final delivery signoff
        if new_status == "accepted":
            lab_order.doctor_acceptance = "accepted"
        elif new_status == "rejected":
            lab_order.doctor_acceptance = "rejected"

        old_status = current_status
        lab_order.status = new_status
        lab_order.save()

        # Create status change log
        LabOrderStatusLog.objects.create(
            lab_order=lab_order,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            notes=notes,
        )

        # Create AuditLog entry
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action="update",
            module="lab_order",
            record_id=str(lab_order.id),
            old_value={"status": old_status},
            new_value={"status": new_status, "notes": notes},
        )

        return Response(
            LabOrderDetailSerializer(lab_order).data,
            status=status.HTTP_200_OK,
        )


class LabOrdersByLabView(generics.ListAPIView):
    """
    List all orders assigned to a specific external laboratory.
    """
    serializer_class = LabOrderListSerializer
    permission_classes = [LabOrderPermission]

    def get_queryset(self):
        lab_id = self.kwargs.get("lab_id")
        queryset = LabOrder.objects.filter(lab_id=lab_id).order_by("-created_at")

        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset


class OverdueLabOrdersView(generics.ListAPIView):
    """
    List all lab orders where promised_delivery_date is in the past and order is not yet finished.
    Dashboard query for tracking late lab work.
    """
    serializer_class = LabOrderListSerializer
    permission_classes = [LabOrderPermission]

    def get_queryset(self):
        today = timezone.now().date()
        exclude_statuses = ["delivered", "accepted", "rejected", "draft"]
        return (
            LabOrder.objects.filter(promised_delivery_date__lt=today)
            .exclude(status__in=exclude_statuses)
            .order_by("promised_delivery_date")
        )
