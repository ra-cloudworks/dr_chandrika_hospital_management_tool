from django.utils import timezone
from rest_framework import generics, views
from rest_framework.response import Response
from .models import Case, CaseVisitNote
from .serializers import CaseSerializer, CaseVisitNoteSerializer, CloseCaseSerializer
from .permissions import CasePermission


class CaseListCreateView(generics.ListCreateAPIView):
    serializer_class = CaseSerializer
    permission_classes = [CasePermission]

    def get_queryset(self):
        qs = Case.objects.filter(patient_id=self.kwargs["patient_id"]).order_by("-opened_at")
        category = self.request.query_params.get("category")
        status_filter = self.request.query_params.get("status")
        if category:
            qs = qs.filter(category=category)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs["patient_id"], opened_by=self.request.user)


class CaseDetailView(generics.RetrieveAPIView):
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    permission_classes = [CasePermission]


class CloseCaseView(views.APIView):
    permission_classes = [CasePermission]

    def post(self, request, pk):
        case = Case.objects.get(pk=pk)
        self.check_object_permissions(request, case)
        serializer = CloseCaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        case.status = "closed"
        case.closed_at = timezone.now()
        case.closure_summary = serializer.validated_data["closure_summary"]
        case.save()
        return Response(CaseSerializer(case).data)


class CaseVisitNoteListCreateView(generics.ListCreateAPIView):
    serializer_class = CaseVisitNoteSerializer
    permission_classes = [CasePermission]

    def get_queryset(self):
        return CaseVisitNote.objects.filter(case_id=self.kwargs["case_id"])

    def perform_create(self, serializer):
        serializer.save(case_id=self.kwargs["case_id"], recorded_by=self.request.user)


class CaseExportView(generics.RetrieveAPIView):
    """Returns the full case with all visit notes and materials as one JSON payload —
    the source data a future PDF/print export would be built from."""
    queryset = Case.objects.all()
    serializer_class = CaseSerializer
    permission_classes = [CasePermission]