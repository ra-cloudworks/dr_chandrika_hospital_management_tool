from rest_framework import serializers
from .models import ToothRecord, EndodonticDetail, ImplantDetail, OrthodonticDetail, ToothRecordHistory


class EndodonticDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = EndodonticDetail
        fields = ["id", "working_length_mm", "canal_count", "obturation_date", "technique_notes"]


class ImplantDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImplantDetail
        fields = ["id", "brand", "diameter_mm", "length_mm", "batch_number", "serial_number",
                  "placement_date", "bone_graft_material", "expiry_date", "warranty_months"]


class OrthodonticDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrthodonticDetail
        fields = ["id", "appliance_type", "bracket_type", "wire_size", "position_notes", "adjustment_date"]


class ToothRecordHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.get_full_name", read_only=True)

    class Meta:
        model = ToothRecordHistory
        fields = ["id", "changed_field", "old_value", "new_value", "changed_by_name", "changed_at"]


class ToothRecordSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source="recorded_by.get_full_name", read_only=True)
    endodontic_detail = EndodonticDetailSerializer(read_only=True)
    implant_detail = ImplantDetailSerializer(read_only=True)
    orthodontic_detail = OrthodonticDetailSerializer(read_only=True)
    history = ToothRecordHistorySerializer(many=True, read_only=True)

    class Meta:
        model = ToothRecord
        fields = [
            "id", "patient", "dentition_type", "tooth_number", "surface", "condition",
            "status", "notes", "recorded_by_name", "recorded_at", "updated_at",
            "endodontic_detail", "implant_detail", "orthodontic_detail", "history",
        ]
        read_only_fields = ["patient", "recorded_at", "updated_at"]