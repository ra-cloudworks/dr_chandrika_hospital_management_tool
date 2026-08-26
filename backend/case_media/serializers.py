from rest_framework import serializers
from .models import MediaFile


class MediaFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True)

    class Meta:
        model = MediaFile
        fields = [
            "id", "patient", "case", "tooth_number", "media_type", "category",
            "file", "caption", "version_number", "previous_version", "is_current",
            "uploaded_by_name", "uploaded_at",
        ]
        read_only_fields = ["patient", "version_number", "previous_version", "is_current", "uploaded_at"]


class DeleteMediaSerializer(serializers.Serializer):
    reason = serializers.CharField()