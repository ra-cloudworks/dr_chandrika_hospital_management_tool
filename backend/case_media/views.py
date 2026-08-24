from django.utils import timezone
from rest_framework import generics, views, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import MediaFile
from .serializers import MediaFileSerializer, DeleteMediaSerializer
from .permissions import MediaFilePermission, ChiefDoctorOnly


class MediaFileListCreateView(generics.ListCreateAPIView):
    serializer_class = MediaFileSerializer
    permission_classes = [MediaFilePermission]
    parser_classes = [MultiPartParser, FormParser]  # required for file uploads — see note below

    def get_queryset(self):
        qs = MediaFile.objects.filter(
            patient_id=self.kwargs["patient_id"], is_deleted=False, is_current=True
        )
        media_type = self.request.query_params.get("media_type")
        case_id = self.request.query_params.get("case_id")
        if media_type:
            qs = qs.filter(media_type=media_type)
        if case_id:
            qs = qs.filter(case_id=case_id)
        return qs.order_by("-uploaded_at")

    def perform_create(self, serializer):
        serializer.save(patient_id=self.kwargs["patient_id"], uploaded_by=self.request.user)


class MediaFileDetailView(generics.RetrieveAPIView):
    queryset = MediaFile.objects.all()
    serializer_class = MediaFileSerializer
    permission_classes = [MediaFilePermission]


class MediaFileNewVersionView(views.APIView):
    """Uploads a replacement file. The old one is kept, just marked not-current."""
    permission_classes = [MediaFilePermission]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        old = MediaFile.objects.get(pk=pk)
        self.check_object_permissions(request, old)

        serializer = MediaFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old.is_current = False
        old.save()

        new_media = serializer.save(
            patient=old.patient, case=old.case, tooth_number=old.tooth_number,
            media_type=old.media_type, uploaded_by=request.user,
            previous_version=old, version_number=old.version_number + 1,
        )
        return Response(MediaFileSerializer(new_media).data, status=status.HTTP_201_CREATED)


class MediaFileSoftDeleteView(views.APIView):
    """Chief Doctor only. Marks a file hidden with a required reason — never actually removes it."""
    permission_classes = [ChiefDoctorOnly]

    def post(self, request, pk):
        media = MediaFile.objects.get(pk=pk)
        serializer = DeleteMediaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        media.is_deleted = True
        media.deleted_by = request.user
        media.deleted_at = timezone.now()
        media.deletion_reason = serializer.validated_data["reason"]
        media.save()
        return Response(MediaFileSerializer(media).data)