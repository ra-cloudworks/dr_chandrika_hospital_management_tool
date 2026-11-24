from rest_framework import serializers
from .models import DentalLab, LabOrder, LabOrderStatusLog


class DentalLabSerializer(serializers.ModelSerializer):
    """
    Serializer for external DentalLab profile management.
    """
    class Meta:
        model = DentalLab
        fields = "__all__"
        read_only_fields = ("created_at",)


class LabOrderStatusLogSerializer(serializers.ModelSerializer):
    """
    Serializer for status change audit logs on lab orders.
    """
    changed_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = LabOrderStatusLog
        fields = (
            "id",
            "lab_order",
            "old_status",
            "new_status",
            "changed_by",
            "changed_by_name",
            "notes",
            "changed_at",
        )
        read_only_fields = ("id", "changed_at")

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_full_name() or obj.changed_by.username
        return "System"


class LabOrderListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for table views and order lists.
    """
    patient_name = serializers.SerializerMethodField(read_only=True)
    patient_code = serializers.CharField(source="patient.patient_code", read_only=True)
    lab_name = serializers.CharField(source="lab.name", read_only=True, default=None)

    class Meta:
        model = LabOrder
        fields = (
            "id",
            "order_number",
            "patient",
            "patient_code",
            "patient_name",
            "work_type",
            "material",
            "status",
            "lab",
            "lab_name",
            "doctor_acceptance",
            "promised_delivery_date",
            "actual_delivery_date",
            "created_at",
        )
        read_only_fields = fields

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}".strip()


class LabOrderDetailSerializer(serializers.ModelSerializer):
    """
    Full detail serializer for LabOrder viewing and updates.
    Includes nested status logs and display fields for ordering doctor, lab, and patient.
    """
    status_logs = LabOrderStatusLogSerializer(many=True, read_only=True)
    patient_name = serializers.SerializerMethodField(read_only=True)
    patient_code = serializers.CharField(source="patient.patient_code", read_only=True)
    ordering_doctor_name = serializers.SerializerMethodField(read_only=True)
    lab_name = serializers.CharField(source="lab.name", read_only=True, default=None)

    class Meta:
        model = LabOrder
        fields = (
            "id",
            "order_number",
            "patient",
            "patient_code",
            "patient_name",
            "tooth_record",
            "treatment_plan_item",
            "lab",
            "lab_name",
            "ordering_doctor",
            "ordering_doctor_name",
            "work_type",
            "tooth_numbers",
            "shade",
            "material",
            "brand",
            "impression_type",
            "special_instructions",
            "status",
            "date_sent",
            "trial_date",
            "promised_delivery_date",
            "actual_delivery_date",
            "lab_cost",
            "patient_charge",
            "warranty_months",
            "remake_count",
            "remake_reason",
            "doctor_acceptance",
            "acceptance_notes",
            "quality_photo",
            "courier_name",
            "courier_tracking",
            "created_by",
            "created_at",
            "updated_at",
            "status_logs",
        )
        read_only_fields = (
            "id",
            "order_number",
            "patient",
            "remake_count",
            "created_by",
            "created_at",
            "updated_at",
        )

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}".strip()

    def get_ordering_doctor_name(self, obj):
        if obj.ordering_doctor:
            return obj.ordering_doctor.get_full_name() or obj.ordering_doctor.username
        return None


class LabOrderStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for validating status transition requests.
    """
    new_status = serializers.ChoiceField(choices=LabOrder.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
