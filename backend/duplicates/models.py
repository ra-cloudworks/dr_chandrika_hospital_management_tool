from django.db import models
from django.conf import settings
from patients.models import Patient


class DuplicateFlag(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        DISMISSED = "dismissed", "Dismissed"
        MERGED = "merged", "Merged"

    patient_a = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="duplicate_flags_a")
    patient_b = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="duplicate_flags_b")
    match_score = models.DecimalField(max_digits=5, decimal_places=2)  # 0.00–100.00
    matched_fields = models.JSONField(default=dict)  # e.g. {"phone": true, "name": 0.86, "dob": true}
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    flagged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="duplicates_flagged",
    )  # null = flagged automatically by the system
    flagged_at = models.DateTimeField(auto_now_add=True)

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="duplicates_reviewed",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["patient_a", "patient_b"], name="unique_duplicate_pair")
        ]

    def __str__(self):
        return f"{self.patient_a} <-> {self.patient_b} ({self.match_score}%)"


class MergeLog(models.Model):
    primary_patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="merge_as_primary")
    merged_patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="merge_as_absorbed")
    merged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="merges_performed")
    field_resolutions = models.JSONField(default=dict)  # which value was kept per conflicting field
    merged_at = models.DateTimeField(auto_now_add=True)
    reversible_until = models.DateTimeField()
    reversed = models.BooleanField(default=False)