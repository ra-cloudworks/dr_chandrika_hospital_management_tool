from django.db import models
from django.conf import settings
from patients.models import Patient


class TreatmentPlan(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PROPOSED = "proposed", "Proposed to Patient"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="treatment_plans")
    title = models.CharField(max_length=200)
    chief_complaint = models.TextField(blank=True)
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="treatment_plans_assigned"
    )
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)

    # Plan-level pricing summary. Full invoicing/payment logic belongs to the
    # separate Billing module (Module 13) — this is just the agreed estimate.
    total_estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    patient_approved_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    consent_required = models.BooleanField(default=True)
    consent_signed = models.BooleanField(default=False)
    consent_signed_at = models.DateTimeField(null=True, blank=True)
    patient_signature = models.TextField(blank=True)  # signature image (base64) or typed acknowledgment

    # AI HOOK: auto-generate a plain-language explanation of this plan in the
    # patient's preferred language, once the Claude API key is available.
    # For now this stays empty and is filled in manually via doctor notes if needed.
    ai_generated_explanation = models.TextField(blank=True)

    revision_number = models.PositiveSmallIntegerField(default=1)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="treatment_plans_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def recalculate_total(self):
        total = sum((item.item_total for item in self.items.all()), 0)
        self.total_estimated_cost = total
        self.save(update_fields=["total_estimated_cost"])

    def __str__(self):
        return f"{self.patient} — {self.title} (v{self.revision_number})"


class TreatmentPlanItem(models.Model):
    class Phase(models.TextChoices):
        URGENT = "urgent", "Urgent"
        PREVENTIVE = "preventive", "Preventive"
        RESTORATIVE = "restorative", "Restorative"
        COSMETIC = "cosmetic", "Cosmetic"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name="items")
    tooth_number = models.CharField(max_length=5, blank=True)
    surface = models.CharField(max_length=10, blank=True)
    procedure_name = models.CharField(max_length=150)
    phase = models.CharField(max_length=15, choices=Phase.choices, default=Phase.RESTORATIVE)
    visit_sequence = models.PositiveSmallIntegerField(default=1)
    expected_duration_minutes = models.PositiveIntegerField(null=True, blank=True)

    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    material_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lab_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    completion_percentage = models.PositiveSmallIntegerField(default=0)
    notes = models.TextField(blank=True)

    @property
    def item_total(self):
        return self.base_price + self.material_price + self.lab_charge + self.tax_amount - self.discount_amount

    def __str__(self):
        return f"{self.plan} — {self.procedure_name}"


class TreatmentPlanRevisionLog(models.Model):
    plan = models.ForeignKey(TreatmentPlan, on_delete=models.CASCADE, related_name="revision_logs")
    revision_number = models.PositiveSmallIntegerField()
    reason_for_change = models.TextField()
    snapshot = models.JSONField()  # full plan+items as they were right before this revision
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)