from rest_framework import serializers
from .models import Patient, Guardian, MedicalHistory, Allergy, FamilyLink


class GuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = ["id", "name", "relationship", "phone", "id_proof_type", "id_proof_number"]


class MedicalHistorySerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.CharField(source="recorded_by.get_full_name", read_only=True)

    class Meta:
        model = MedicalHistory
        fields = ["id", "condition_name", "diagnosed_date", "notes", "is_active",
                  "recorded_by_name", "created_at"]


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = ["id", "allergen", "reaction", "severity"]


class PatientListSerializer(serializers.ModelSerializer):
    """Light payload for the table view."""
    registered_by_name = serializers.CharField(source="registered_by.get_full_name", read_only=True)

    class Meta:
        model = Patient
        fields = ["id", "patient_code", "first_name", "last_name", "phone",
                  "dob", "gender", "status", "registered_by_name", "created_at"]


class PatientDetailSerializer(serializers.ModelSerializer):
    """Full payload — used for retrieve and for create/update."""
    guardians = GuardianSerializer(many=True, read_only=True)
    medical_history = MedicalHistorySerializer(many=True, read_only=True)
    allergies = AllergySerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id", "patient_code", "first_name", "last_name", "dob", "gender",
            "phone", "email", "address", "city", "state", "country",
            "preferred_language", "photo", "emergency_contact_name",
            "emergency_contact_phone", "referral_source", "abha_id",
            "status", "guardians", "medical_history", "allergies",
            "created_at", "updated_at",
        ]
        read_only_fields = ["patient_code", "status"]


class PatientPortalSerializer(serializers.ModelSerializer):
    """Read-only, scoped view for the patient's own portal login."""
    medical_history = MedicalHistorySerializer(many=True, read_only=True)
    allergies = AllergySerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = ["id", "patient_code", "first_name", "last_name", "dob",
                  "gender", "phone", "email", "address", "medical_history", "allergies"]
        read_only_fields = fields