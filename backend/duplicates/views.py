from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import generics, views, status
from rest_framework.response import Response
from patients.models import Patient
from .models import DuplicateFlag, MergeLog
from .serializers import DuplicateFlagSerializer, MergeRequestSerializer, MergeLogSerializer
from .permissions import IsChiefDoctor, CanViewFlagsOrChiefDoctorActs, CanResolveDuplicates
from .detection import scan_all_patients

class DuplicateFlagListView(generics.ListAPIView):
    serializer_class = DuplicateFlagSerializer
    permission_classes = [CanViewFlagsOrChiefDoctorActs]

    def get_queryset(self):
        return DuplicateFlag.objects.filter(status="pending").order_by("-match_score")


class DismissFlagView(generics.UpdateAPIView):
    queryset = DuplicateFlag.objects.all()
    serializer_class = DuplicateFlagSerializer
    # Allows Chief Doctor and Receptionists to dismiss false-positive flags
    permission_classes = [CanResolveDuplicates]

    def patch(self, request, *args, **kwargs):
        flag = self.get_object()
        flag.status = "dismissed"
        flag.reviewed_by = request.user
        flag.reviewed_at = timezone.now()
        flag.save()
        return Response(DuplicateFlagSerializer(flag).data)


class MergePatientsView(views.APIView):
    """Executes the actual merge for patient registration roles, wrapped in a DB transaction."""
    # Allows Chief Doctor and Receptionists to execute patient record merges
    permission_classes = [CanResolveDuplicates]

    def post(self, request):
        serializer = MergeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        flag = serializer.validated_data["flag"]
        primary_id = serializer.validated_data["primary_patient_id"]
        resolutions = serializer.validated_data["field_resolutions"]

        secondary_id = flag.patient_b_id if primary_id == flag.patient_a_id else flag.patient_a_id

        with transaction.atomic():
            primary = Patient.objects.select_for_update().get(id=primary_id)
            secondary = Patient.objects.select_for_update().get(id=secondary_id)

            # Apply the staff-chosen field resolutions onto the surviving record
            for field, value in resolutions.items():
                if hasattr(primary, field):
                    setattr(primary, field, value)
            primary.save()

            # Soft-close the absorbed record — never hard-delete
            secondary.status = "merged"
            secondary.merged_into = primary
            secondary.save()

            flag.status = "merged"
            flag.reviewed_by = request.user
            flag.reviewed_at = timezone.now()
            flag.save()

            log = MergeLog.objects.create(
                primary_patient=primary,
                merged_patient=secondary,
                merged_by=request.user,
                field_resolutions=resolutions,
                reversible_until=timezone.now() + timedelta(hours=48),
            )

        return Response(MergeLogSerializer(log).data, status=status.HTTP_201_CREATED)


class MergeHistoryListView(generics.ListAPIView):
    queryset = MergeLog.objects.all().order_by("-merged_at")
    serializer_class = MergeLogSerializer
    permission_classes = [IsChiefDoctor]

class ScanDuplicatesView(views.APIView):
    """Triggers a full re-scan on demand. Chief Doctor only — this can be an expensive operation."""
    permission_classes = [IsChiefDoctor]

    def post(self, request):
        total = scan_all_patients()
        pending_count = DuplicateFlag.objects.filter(status="pending").count()
        return Response({
            "message": f"Scanned {total} patients.",
            "pending_flags": pending_count,
        })