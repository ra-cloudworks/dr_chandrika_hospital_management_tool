from rest_framework import serializers
from .models import Case, CaseVisitNote, MaterialUsed


class MaterialUsedSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialUsed
        fields = ["id", "material_name", "batch_number", "quantity", "unit"]


class CaseVisitNoteSerializer(serializers.ModelSerializer):
    materials_used = MaterialUsedSerializer(many=True, required=False)
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    assistant_name = serializers.CharField(source="assistant.get_full_name", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.get_full_name", read_only=True)

    class Meta:
        model = CaseVisitNote
        fields = [
            "id", "chief_complaint", "examination_findings", "diagnosis", "procedure_performed",
            "complications", "outcome_notes", "next_appointment_notes", "ai_generated_summary",
            "doctor", "doctor_name", "assistant", "assistant_name", "recorded_by_name",
            "visit_date", "materials_used",
        ]
        read_only_fields = ["ai_generated_summary", "visit_date"]

    def create(self, validated_data):
        materials_data = validated_data.pop("materials_used", [])
        visit_note = CaseVisitNote.objects.create(**validated_data)
        for material_data in materials_data:
            MaterialUsed.objects.create(visit_note=visit_note, **material_data)
        return visit_note


class CaseSerializer(serializers.ModelSerializer):
    visit_notes = CaseVisitNoteSerializer(many=True, read_only=True)
    opened_by_name = serializers.CharField(source="opened_by.get_full_name", read_only=True)
    patient_code = serializers.CharField(source="patient.patient_code", read_only=True)

    class Meta:
        model = Case
        fields = [
            "id", "patient", "patient_code", "case_number", "title", "category", "status",
            "opened_by_name", "opened_at", "closed_at", "closure_summary", "visit_notes",
        ]
        read_only_fields = ["patient", "case_number", "status", "opened_at", "closed_at"]


class CloseCaseSerializer(serializers.Serializer):
    closure_summary = serializers.CharField()