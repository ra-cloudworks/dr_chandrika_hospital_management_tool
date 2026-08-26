from rest_framework import generics
from .models import PerioExam
from .serializers import PerioExamSerializer
from .permissions import PerioExamPermission


class PerioExamListCreateView(generics.ListCreateAPIView):
    serializer_class = PerioExamSerializer
    permission_classes = [PerioExamPermission]

    def get_queryset(self):
        return PerioExam.objects.filter(patient_id=self.kwargs["patient_id"]).order_by("-exam_date")

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs["patient_id"], performed_by=self.request.user)


class PerioExamDetailView(generics.RetrieveDestroyAPIView):
    queryset = PerioExam.objects.all()
    serializer_class = PerioExamSerializer
    permission_classes = [PerioExamPermission]

    def perform_destroy(self, instance):
        # Soft-void — never hard-delete a clinical exam
        instance.diagnosis_summary = "[VOIDED] " + instance.diagnosis_summary
        instance.save()