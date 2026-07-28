from rest_framework import generics, permissions
from .models import Patient, MedicalHistory, Allergy, Guardian
from .serializers import (
    PatientListSerializer, PatientDetailSerializer, PatientPortalSerializer,
    MedicalHistorySerializer, AllergySerializer, GuardianSerializer,
)
from .permissions import PatientAccessPermission, PatientObjectPermission, MedicalRecordPermission


class PatientListCreateView(generics.ListCreateAPIView):
    permission_classes = [PatientAccessPermission]

    def get_queryset(self):
        qs = Patient.objects.exclude(status="merged").order_by("-created_at")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(first_name__icontains=search) | qs.filter(
                last_name__icontains=search) | qs.filter(phone__icontains=search
            ) | qs.filter(patient_code__icontains=search)
        return qs

    def get_serializer_class(self):
        return PatientDetailSerializer if self.request.method == "POST" else PatientListSerializer

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Patient.objects.all()
    permission_classes = [PatientObjectPermission]

    def get_serializer_class(self):
        if self.request.user.role == "patient":
            return PatientPortalSerializer
        return PatientDetailSerializer

    def perform_destroy(self, instance):
        # Soft-delete only — never hard-delete a patient record
        instance.status = "inactive"
        instance.save()


class MyPatientProfileView(generics.RetrieveAPIView):
    """For the logged-in patient to view their own record."""
    serializer_class = PatientPortalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.patient_profile


class MedicalHistoryListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicalHistorySerializer
    permission_classes = [MedicalRecordPermission]

    def get_queryset(self):
        return MedicalHistory.objects.filter(patient_id=self.kwargs["patient_id"])

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs["patient_id"], recorded_by=self.request.user)


class AllergyListCreateView(generics.ListCreateAPIView):
    serializer_class = AllergySerializer
    permission_classes = [MedicalRecordPermission]

    def get_queryset(self):
        return Allergy.objects.filter(patient_id=self.kwargs["patient_id"])

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs["patient_id"], recorded_by=self.request.user)


class GuardianListCreateView(generics.ListCreateAPIView):
    serializer_class = GuardianSerializer
    permission_classes = [MedicalRecordPermission]

    def get_queryset(self):
        return Guardian.objects.filter(patient_id=self.kwargs["patient_id"])

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs["patient_id"])