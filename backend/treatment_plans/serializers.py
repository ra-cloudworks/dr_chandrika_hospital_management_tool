from rest_framework import serializers
from .models import TreatmentPlan, TreatmentPlanItem, TreatmentPlanRevisionLog


class TreatmentPlanItemSerializer(serializers.ModelSerializer):
    item_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = TreatmentPlanItem
        fields = [
            "id", "tooth_number", "surface", "procedure_name", "phase", "visit_sequence",
            "expected_duration_minutes", "base_price", "material_price", "lab_charge",
            "discount_amount", "tax_amount", "item_total", "status", "completion_percentage", "notes",
        ]


class TreatmentPlanRevisionLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.get_full_name", read_only=True)

    class Meta:
        model = TreatmentPlanRevisionLog
        fields = ["id", "revision_number", "reason_for_change", "snapshot", "changed_by_name", "changed_at"]


class TreatmentPlanSerializer(serializers.ModelSerializer):
    items = TreatmentPlanItemSerializer(many=True, read_only=True)
    revision_logs = TreatmentPlanRevisionLogSerializer(many=True, read_only=True)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = TreatmentPlan
        fields = [
            "id", "patient", "title", "chief_complaint", "doctor", "doctor_name", "status",
            "total_estimated_cost", "patient_approved_price", "consent_required", "consent_signed",
            "consent_signed_at", "patient_signature", "ai_generated_explanation", "revision_number",
            "created_by_name", "created_at", "updated_at", "items", "revision_logs",
        ]
        read_only_fields = [
            "patient", "status", "total_estimated_cost", "consent_signed", "consent_signed_at",
            "patient_signature", "ai_generated_explanation", "revision_number", "created_at", "updated_at",
        ]


class TreatmentPlanItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TreatmentPlanItem
        fields = [
            "id", "tooth_number", "surface", "procedure_name", "phase", "visit_sequence",
            "expected_duration_minutes", "base_price", "material_price", "lab_charge",
            "discount_amount", "tax_amount", "status", "completion_percentage", "notes",
        ]


class ConsentActionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["accept", "reject"])
    patient_signature = serializers.CharField(required=False, allow_blank=True)


class ReviseActionSerializer(serializers.Serializer):
    reason_for_change = serializers.CharField()