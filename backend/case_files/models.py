from django.db import models
from django.conf import settings
from patients.models import Patient


class Case(models.Model):
    class Category(models.TextChoices):
        GENERAL = "general", "General"
        ORTHODONTIC = "orthodontic", "Orthodontic"
        SURGICAL = "surgical", "Surgical"
        COSMETIC = "cosmetic", "Cosmetic"
        EMERGENCY = "emergency", "Emergency"
        PEDIATRIC = "pediatric", "Pediatric"
        PERIODONTAL = "periodontal", "Periodontal"
        PROSTHODONTIC = "prosthodontic", "Prosthodontic (crowns/dentures/implants)"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="cases")
    case_number = models.CharField(max_length=20, unique=True, editable=False)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=15, choices=Category.choices, default=Category.GENERAL)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)

    opened_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="cases_opened"
    )
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    closure_summary = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.case_number:
            last = Case.objects.order_by("id").last()
            next_id = (last.id + 1) if last else 1
            self.case_number = f"CASE{next_id:05d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.case_number} — {self.title} ({self.patient})"


class CaseVisitNote(models.Model):
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="visit_notes")

    chief_complaint = models.TextField(blank=True)
    examination_findings = models.TextField(blank=True)
    diagnosis = models.TextField(blank=True)
    procedure_performed = models.TextField(blank=True)
    complications = models.TextField(blank=True)
    outcome_notes = models.TextField(blank=True)
    next_appointment_notes = models.TextField(blank=True)

    # AI HOOK: auto-generate a concise visit summary from the fields above,
    # once the Claude API key is available. Doctor reviews/edits before saving.
    ai_generated_summary = models.TextField(blank=True)

    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="visit_notes_as_doctor"
    )
    assistant = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="visit_notes_as_assistant",
    )
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    visit_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["visit_date"]

    def __str__(self):
        return f"{self.case} — visit {self.visit_date:%Y-%m-%d}"


class MaterialUsed(models.Model):
    visit_note = models.ForeignKey(CaseVisitNote, on_delete=models.CASCADE, related_name="materials_used")
    material_name = models.CharField(max_length=150)
    batch_number = models.CharField(max_length=100, blank=True)
    quantity = models.DecimalField(max_digits=6, decimal_places=2, default=1)
    unit = models.CharField(max_length=20, blank=True)  # e.g. "ml", "capsule", "pack"