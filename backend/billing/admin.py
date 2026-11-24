from django.contrib import admin
from .models import (
    ClinicFinancialSettings,
    Invoice,
    InvoiceLineItem,
    DiscountApprovalRequest,
    Payment,
    PriceOverrideLog,
    PatientAccount,
)


class InvoiceLineItemInline(admin.TabularInline):
    model = InvoiceLineItem
    extra = 0
    fields = (
        "description",
        "tooth_number",
        "quantity",
        "unit_price",
        "internal_unit_cost",
        "discount_amount",
        "discount_approved",
        "tax_amount",
        "line_total",
    )
    readonly_fields = ("line_total",)


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    fields = (
        "payment_number",
        "payment_type",
        "amount",
        "payment_method",
        "payment_date",
        "reference_number",
        "is_voided",
    )
    readonly_fields = ("payment_number",)


@admin.register(ClinicFinancialSettings)
class ClinicFinancialSettingsAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_prefix",
        "currency_symbol",
        "discount_approval_threshold_percent",
        "discount_approval_threshold_amount",
        "default_tax_percent",
        "updated_at",
    )

    def has_add_permission(self, request):
        # Enforce singleton pattern in Django Admin
        if ClinicFinancialSettings.objects.exists():
            return False
        return super().has_add_permission(request)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number",
        "patient",
        "status",
        "grand_total",
        "amount_paid",
        "balance_due",
        "issue_date",
        "due_date",
    )
    list_filter = ("status", "issue_date", "due_date")
    search_fields = ("invoice_number", "patient__first_name", "patient__last_name", "patient__patient_code")
    readonly_fields = (
        "invoice_number",
        "subtotal",
        "total_discount",
        "total_tax",
        "grand_total",
        "internal_cost_total",
        "balance_due",
        "created_at",
        "updated_at",
    )
    inlines = [InvoiceLineItemInline, PaymentInline]


@admin.register(InvoiceLineItem)
class InvoiceLineItemAdmin(admin.ModelAdmin):
    list_display = (
        "invoice",
        "description",
        "quantity",
        "unit_price",
        "discount_amount",
        "discount_approved",
        "tax_amount",
        "line_total",
    )
    list_filter = ("discount_approved",)
    search_fields = ("description", "invoice__invoice_number", "tooth_number")


@admin.register(DiscountApprovalRequest)
class DiscountApprovalRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "invoice",
        "requested_discount_amount",
        "discount_percent",
        "status",
        "requested_by",
        "reviewed_by",
        "requested_at",
    )
    list_filter = ("status", "requested_at")
    search_fields = ("invoice__invoice_number", "reason", "review_notes")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "payment_number",
        "patient",
        "payment_type",
        "amount",
        "payment_method",
        "is_voided",
        "payment_date",
    )
    list_filter = ("payment_type", "payment_method", "is_voided", "payment_date")
    search_fields = ("payment_number", "patient__first_name", "patient__last_name", "reference_number")


@admin.register(PriceOverrideLog)
class PriceOverrideLogAdmin(admin.ModelAdmin):
    list_display = (
        "line_item",
        "old_price",
        "new_price",
        "reason",
        "changed_by",
        "changed_at",
    )
    search_fields = ("reason", "line_item__description", "line_item__invoice__invoice_number")


@admin.register(PatientAccount)
class PatientAccountAdmin(admin.ModelAdmin):
    list_display = ("patient", "credit_balance", "updated_at")
    search_fields = ("patient__first_name", "patient__last_name", "patient__patient_code")
