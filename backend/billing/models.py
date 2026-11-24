from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone

from patients.models import Patient
from treatment_plans.models import TreatmentPlan, TreatmentPlanItem


class ClinicFinancialSettings(models.Model):
    """
    Single-row settings table for governance thresholds.
    Only one instance exists for the clinic.
    """
    discount_approval_threshold_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("10.00"),
        help_text="Discounts above this % require Chief Doctor approval",
    )
    discount_approval_threshold_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("2000.00"),
        help_text="Discounts above this absolute amount require Chief Doctor approval",
    )
    default_tax_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("0.00"),
        help_text="GST or applicable default tax percentage",
    )
    currency_symbol = models.CharField(max_length=5, default="₹")
    invoice_prefix = models.CharField(max_length=10, default="INV")
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        settings_obj, _ = cls.objects.get_or_create(id=1)
        return settings_obj

    def __str__(self):
        return f"Clinic Financial Settings (Prefix: {self.invoice_prefix}, Threshold: {self.discount_approval_threshold_percent}%)"


class Invoice(models.Model):
    """
    Represents a patient billing invoice with comprehensive financial governance.
    """
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ISSUED = "issued", "Issued"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        VOID = "void", "Void"

    invoice_number = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="invoices")
    treatment_plan = models.ForeignKey(
        TreatmentPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices"
    )
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    issue_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)

    # Totals calculated via recalculate_totals()
    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        help_text="Sum of line item base amounts before discount/tax",
    )
    total_discount = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        help_text="Sum of approved discounts",
    )
    total_tax = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        help_text="Sum of line item taxes",
    )
    grand_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        help_text="Final patient-facing invoice amount",
    )
    internal_cost_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00"),
        help_text="Sum of internal clinic costs; NEVER shown to patient",
    )
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    notes = models.TextField(blank=True)
    void_reason = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoices_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-generate invoice_number (Prefix + 5-digit zero-padded, e.g. INV00001)
        if not self.invoice_number:
            cfg = ClinicFinancialSettings.get_settings()
            prefix = cfg.invoice_prefix or "INV"
            last = Invoice.objects.order_by("id").last()
            next_id = (last.id + 1) if last else 1
            num = f"{prefix}{next_id:05d}"
            while Invoice.objects.filter(invoice_number=num).exists():
                next_id += 1
                num = f"{prefix}{next_id:05d}"
            self.invoice_number = num
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        """
        Sums line items for subtotal/discount/tax/grand_total/internal_cost_total.
        Only approved discounts (discount_approved=True) reduce the grand total.
        Sets balance_due = grand_total - amount_paid.
        Updates status based on payment state.
        """
        items = self.line_items.all()
        subtotal = sum((item.unit_price * item.quantity for item in items), Decimal("0.00"))
        total_tax = sum((item.tax_amount for item in items), Decimal("0.00"))
        # Only count discounts that have been approved or within threshold
        total_discount = sum((item.discount_amount for item in items if item.discount_approved), Decimal("0.00"))
        grand_total = max(Decimal("0.00"), subtotal + total_tax - total_discount)
        internal_cost_total = sum((item.line_internal_cost for item in items), Decimal("0.00"))

        self.subtotal = subtotal
        self.total_tax = total_tax
        self.total_discount = total_discount
        self.grand_total = grand_total
        self.internal_cost_total = internal_cost_total
        self.balance_due = max(Decimal("0.00"), grand_total - self.amount_paid)

        if self.status != self.Status.VOID:
            if self.grand_total > Decimal("0.00") and self.balance_due <= Decimal("0.00"):
                self.status = self.Status.PAID
            elif self.amount_paid > Decimal("0.00") and self.amount_paid < self.grand_total:
                self.status = self.Status.PARTIALLY_PAID
            elif self.status == self.Status.PAID and self.balance_due > Decimal("0.00"):
                self.status = self.Status.ISSUED if self.issue_date else self.Status.DRAFT

        self.save(update_fields=[
            "subtotal", "total_tax", "total_discount", "grand_total",
            "internal_cost_total", "amount_paid", "balance_due", "status", "updated_at"
        ])

    def __str__(self):
        return f"{self.invoice_number} - {self.patient} ({self.status})"


class InvoiceLineItem(models.Model):
    """
    One charged procedure or product on the invoice.
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="line_items")
    treatment_plan_item = models.ForeignKey(
        TreatmentPlanItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="invoice_line_items"
    )
    description = models.CharField(max_length=255)
    tooth_number = models.CharField(max_length=50, blank=True)
    quantity = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("1.00"))
    unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"),
        help_text="Patient-facing price per unit",
    )
    internal_unit_cost = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"),
        help_text="NEVER shown to patient",
    )
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    discount_approved = models.BooleanField(
        default=False,
        help_text="True if discount is within threshold or approved by Chief Doctor",
    )
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    notes = models.TextField(blank=True)

    @property
    def line_total(self):
        """
        Patient-facing total for this line.
        If discount is approved, it deducts discount_amount.
        """
        discount = self.discount_amount if self.discount_approved else Decimal("0.00")
        return (self.unit_price * self.quantity) + self.tax_amount - discount

    @property
    def line_internal_cost(self):
        """
        Clinic internal cost for this line.
        """
        return self.internal_unit_cost * self.quantity

    def __str__(self):
        return f"{self.invoice.invoice_number} — {self.description}"


class DiscountApprovalRequest(models.Model):
    """
    Created when a discount exceeds clinic governance thresholds and needs Chief Doctor approval.
    """
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="discount_requests")
    line_item = models.ForeignKey(
        InvoiceLineItem, on_delete=models.CASCADE, null=True, blank=True, related_name="discount_requests"
    )
    requested_discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)
    reason = models.TextField(help_text="Required justification for discount override")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="discount_requests_made"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="discount_requests_reviewed"
    )
    review_notes = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Discount Request #{self.id} for {self.invoice.invoice_number} ({self.status})"


class Payment(models.Model):
    """
    Monetary transaction from/to a patient (payment, advance prepayment, or refund).
    """
    class PaymentType(models.TextChoices):
        PAYMENT = "payment", "Payment"
        ADVANCE = "advance", "Advance"
        REFUND = "refund", "Refund"

    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        CARD = "card", "Card"
        UPI = "upi", "UPI"
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        CHEQUE = "cheque", "Cheque"
        INSURANCE = "insurance", "Insurance"

    payment_number = models.CharField(max_length=20, unique=True, editable=False)
    invoice = models.ForeignKey(
        Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments"
    )
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="payments")
    payment_type = models.CharField(max_length=10, choices=PaymentType.choices, default=PaymentType.PAYMENT)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=15, choices=PaymentMethod.choices)
    reference_number = models.CharField(max_length=100, blank=True)
    payment_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_voided = models.BooleanField(default=False)
    void_reason = models.CharField(max_length=255, blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-generate payment_number format PAY00001
        if not self.payment_number:
            last = Payment.objects.order_by("id").last()
            next_id = (last.id + 1) if last else 1
            num = f"PAY{next_id:05d}"
            while Payment.objects.filter(payment_number=num).exists():
                next_id += 1
                num = f"PAY{next_id:05d}"
            self.payment_number = num
        if not self.payment_date:
            self.payment_date = timezone.now().date()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.payment_number} - {self.patient} ({self.payment_type}: {self.amount})"


class PriceOverrideLog(models.Model):
    """
    Logs any manual change to a line item's unit_price away from the standard/treatment-plan price.
    """
    line_item = models.ForeignKey(InvoiceLineItem, on_delete=models.CASCADE, related_name="price_overrides")
    old_price = models.DecimalField(max_digits=10, decimal_places=2)
    new_price = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.CharField(max_length=255)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Override for {self.line_item}: {self.old_price} -> {self.new_price}"


class PatientAccount(models.Model):
    """
    Running credit/advance balance per patient so advances carry across invoices.
    """
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name="account")
    credit_balance = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Account for {self.patient}: Credit {self.credit_balance}"
