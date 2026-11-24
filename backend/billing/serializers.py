from decimal import Decimal
from rest_framework import serializers
from .models import (
    ClinicFinancialSettings,
    Invoice,
    InvoiceLineItem,
    DiscountApprovalRequest,
    Payment,
    PriceOverrideLog,
    PatientAccount,
)


class ClinicFinancialSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicFinancialSettings
        fields = [
            "id",
            "discount_approval_threshold_percent",
            "discount_approval_threshold_amount",
            "default_tax_percent",
            "currency_symbol",
            "invoice_prefix",
            "updated_at",
        ]


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    line_internal_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = InvoiceLineItem
        fields = [
            "id",
            "invoice",
            "treatment_plan_item",
            "description",
            "tooth_number",
            "quantity",
            "unit_price",
            "internal_unit_cost",
            "discount_amount",
            "discount_approved",
            "tax_amount",
            "line_total",
            "line_internal_cost",
            "notes",
        ]
        read_only_fields = ["id", "discount_approved", "line_total", "line_internal_cost"]

    def to_representation(self, instance):
        """
        CRITICAL GOVERNANCE RULE:
        Clinic internal costs ('internal_unit_cost' and 'line_internal_cost') must NEVER
        be exposed to patients or standard non-financial staff. Only users with the
        'chief_doctor' or 'accountant' role are authorized to view internal margin fields.
        """
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        role = getattr(user, "role", None) if user and user.is_authenticated else None

        if role not in {"chief_doctor", "accountant"}:
            data.pop("internal_unit_cost", None)
            data.pop("line_internal_cost", None)

        return data


class PaymentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "payment_number",
            "invoice",
            "patient",
            "patient_name",
            "payment_type",
            "amount",
            "payment_method",
            "reference_number",
            "payment_date",
            "notes",
            "is_voided",
            "void_reason",
            "recorded_by",
            "recorded_by_name",
            "created_at",
        ]
        read_only_fields = ["id", "payment_number", "created_at"]

    def get_recorded_by_name(self, obj):
        if obj.recorded_by:
            return obj.recorded_by.get_full_name() or obj.recorded_by.username
        return None

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}".strip()


class DiscountApprovalRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DiscountApprovalRequest
        fields = [
            "id",
            "invoice",
            "line_item",
            "requested_discount_amount",
            "discount_percent",
            "reason",
            "status",
            "requested_by",
            "requested_by_name",
            "reviewed_by",
            "reviewed_by_name",
            "review_notes",
            "requested_at",
            "reviewed_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "requested_by",
            "reviewed_by",
            "reviewed_at",
            "requested_at",
        ]

    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.get_full_name() or obj.requested_by.username
        return None

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return None


class PriceOverrideLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PriceOverrideLog
        fields = [
            "id",
            "line_item",
            "old_price",
            "new_price",
            "reason",
            "changed_by",
            "changed_by_name",
            "changed_at",
        ]
        read_only_fields = ["id", "changed_at"]

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_full_name() or obj.changed_by.username
        return None


class InvoiceListSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "patient",
            "patient_name",
            "status",
            "grand_total",
            "amount_paid",
            "balance_due",
            "issue_date",
            "due_date",
            "created_at",
        ]

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}".strip()


class InvoiceDetailSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    line_items = InvoiceLineItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    discount_requests = DiscountApprovalRequestSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "patient",
            "patient_name",
            "treatment_plan",
            "status",
            "issue_date",
            "due_date",
            "subtotal",
            "total_discount",
            "total_tax",
            "grand_total",
            "internal_cost_total",
            "amount_paid",
            "balance_due",
            "notes",
            "void_reason",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
            "line_items",
            "payments",
            "discount_requests",
        ]
        read_only_fields = [
            "id",
            "invoice_number",
            "status",
            "subtotal",
            "total_discount",
            "total_tax",
            "grand_total",
            "internal_cost_total",
            "amount_paid",
            "balance_due",
            "void_reason",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}".strip()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def to_representation(self, instance):
        """
        CRITICAL GOVERNANCE RULE:
        'internal_cost_total' must NEVER appear in an invoice response served to a patient
        or standard staff. Only users with 'chief_doctor' or 'accountant' role can see it.
        """
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        role = getattr(user, "role", None) if user and user.is_authenticated else None

        if role not in {"chief_doctor", "accountant"}:
            data.pop("internal_cost_total", None)

        return data


class PatientAccountSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = PatientAccount
        fields = [
            "id",
            "patient",
            "patient_name",
            "credit_balance",
            "updated_at",
        ]

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}".strip()


# Action Serializers (plain Serializer for request body validation)

class RecordPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    payment_method = serializers.ChoiceField(choices=Payment.PaymentMethod.choices)
    reference_number = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    payment_type = serializers.ChoiceField(choices=Payment.PaymentType.choices, default="payment")


class DiscountRequestActionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["approve", "reject"])
    review_notes = serializers.CharField(required=False, allow_blank=True, default="")


class PriceOverrideSerializer(serializers.Serializer):
    new_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.00"))
    reason = serializers.CharField(max_length=255, required=True, allow_blank=False)


class VoidSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255, required=True, allow_blank=False)
