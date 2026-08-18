from rest_framework import generics
from .models import ToothRecord, EndodonticDetail, ImplantDetail, OrthodonticDetail, ToothRecordHistory
from .serializers import (
    ToothRecordSerializer, EndodonticDetailSerializer,
    ImplantDetailSerializer, OrthodonticDetailSerializer,
)
from .permissions import ToothRecordPermission

TRACKED_FIELDS = ["condition", "status", "surface", "notes"]


class ToothRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = ToothRecordSerializer
    permission_classes = [ToothRecordPermission]

    def get_queryset(self):
        return ToothRecord.objects.filter(patient_id=self.kwargs["patient_id"]).order_by("tooth_number")

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs["patient_id"], recorded_by=self.request.user)


class ToothRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ToothRecord.objects.all()
    serializer_class = ToothRecordSerializer
    permission_classes = [ToothRecordPermission]

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_values = {f: getattr(old_instance, f) for f in TRACKED_FIELDS}

        updated = serializer.save()

        for field in TRACKED_FIELDS:
            new_value = getattr(updated, field)
            if str(old_values[field]) != str(new_value):
                ToothRecordHistory.objects.create(
                    tooth_record=updated,
                    changed_field=field,
                    old_value=str(old_values[field]),
                    new_value=str(new_value),
                    changed_by=self.request.user,
                )

    def perform_destroy(self, instance):
        # Soft-void, never hard-delete a clinical record
        ToothRecordHistory.objects.create(
            tooth_record=instance,
            changed_field="status",
            old_value=instance.status,
            new_value="voided",
            changed_by=self.request.user,
        )
        instance.status = "rejected"
        instance.notes += " [VOIDED]"
        instance.save()


class EndodonticDetailCreateView(generics.CreateAPIView):
    serializer_class = EndodonticDetailSerializer
    permission_classes = [ToothRecordPermission]

    def perform_create(self, serializer):
        serializer.save(tooth_record_id=self.kwargs["tooth_record_id"])


class ImplantDetailCreateView(generics.CreateAPIView):
    serializer_class = ImplantDetailSerializer
    permission_classes = [ToothRecordPermission]

    def perform_create(self, serializer):
        serializer.save(tooth_record_id=self.kwargs["tooth_record_id"])


class OrthodonticDetailCreateView(generics.CreateAPIView):
    serializer_class = OrthodonticDetailSerializer
    permission_classes = [ToothRecordPermission]

    def perform_create(self, serializer):
        serializer.save(tooth_record_id=self.kwargs["tooth_record_id"])