from rest_framework import serializers
from .models import DuplicateFlag, MergeLog
from patients.serializers import PatientDetailSerializer


class DuplicateFlagSerializer(serializers.ModelSerializer):
    patient_a = PatientDetailSerializer(read_only=True)
    patient_b = PatientDetailSerializer(read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.get_full_name", read_only=True)

    class Meta:
        model = DuplicateFlag
        fields = ["id", "patient_a", "patient_b", "match_score", "matched_fields",
                  "status", "flagged_at", "reviewed_by_name", "reviewed_at"]


class MergeRequestSerializer(serializers.Serializer):
    """Not a ModelSerializer — this validates the merge action's input, not a stored object directly."""
    flag_id = serializers.IntegerField()
    primary_patient_id = serializers.IntegerField()
    field_resolutions = serializers.JSONField()

    def validate(self, attrs):
        try:
            flag = DuplicateFlag.objects.get(id=attrs["flag_id"], status="pending")
        except DuplicateFlag.DoesNotExist:
            raise serializers.ValidationError("No pending duplicate flag with that ID.")

        valid_ids = {flag.patient_a_id, flag.patient_b_id}
        if attrs["primary_patient_id"] not in valid_ids:
            raise serializers.ValidationError("primary_patient_id must be one of the flagged patients.")

        attrs["flag"] = flag
        return attrs


class MergeLogSerializer(serializers.ModelSerializer):
    primary_patient_code = serializers.CharField(source="primary_patient.patient_code", read_only=True)
    merged_patient_code = serializers.CharField(source="merged_patient.patient_code", read_only=True)
    merged_by_name = serializers.CharField(source="merged_by.get_full_name", read_only=True)

    class Meta:
        model = MergeLog
        fields = ["id", "primary_patient_code", "merged_patient_code", "merged_by_name",
                  "field_resolutions", "merged_at", "reversible_until", "reversed"]