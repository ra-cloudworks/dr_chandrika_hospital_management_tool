from rest_framework import generics
from .models import Vitals
from .serializers import VitalsSerializer
from .permissions import VitalsPermission


class PatientVitalsListCreateView(generics.ListCreateAPIView):
    serializer_class = VitalsSerializer
    permission_classes = [VitalsPermission]

    def get_queryset(self):
        return Vitals.objects.filter(patient_id=self.kwargs["patient_id"]).order_by("-recorded_at")

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs["patient_id"], recorded_by=self.request.user)


class MyVitalsListView(generics.ListAPIView):
    """For a logged-in patient viewing their own history."""
    serializer_class = VitalsSerializer
    permission_classes = [VitalsPermission]

    def get_queryset(self):
        return Vitals.objects.filter(patient__linked_user=self.request.user).order_by("-recorded_at")