from django.db import models
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from duplicates.detection import find_duplicates_for
from duplicates.models import DuplicateFlag
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

    # Overriding create method to trigger automatic duplicate scanning when registering a new patient
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Save the new patient record with the currently logged-in user
        patient = serializer.save(registered_by=self.request.user)

        # Trigger duplicate scan for the newly registered patient against active records
        find_duplicates_for(patient)

        # Check if any pending duplicate flag was generated involving this newly created patient
        has_duplicates = DuplicateFlag.objects.filter(
            status="pending"
        ).filter(
            models.Q(patient_a=patient) | models.Q(patient_b=patient)
        ).exists()

        data = serializer.data
        # Attach has_duplicates flag to response so frontend knows whether to navigate to /duplicates
        data["has_duplicates"] = has_duplicates
        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)


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