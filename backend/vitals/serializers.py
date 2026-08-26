from rest_framework import serializers
from .models import Vitals


class VitalsSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source="recorded_by.get_full_name", read_only=True)

    class Meta:
        model = Vitals
        fields = [
            "id", "patient", "context", "bp_systolic", "bp_diastolic", "pulse",
            "blood_sugar", "temperature", "spo2", "weight_kg", "height_cm",
            "notes", "is_flagged", "flagged_reason", "recorded_by_name", "recorded_at",
        ]
        read_only_fields = ["patient", "is_flagged", "flagged_reason", "recorded_at"]