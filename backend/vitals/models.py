from django.db import models
from django.conf import settings
from patients.models import Patient


class Vitals(models.Model):
    class Context(models.TextChoices):
        REGISTRATION = "registration", "Registration"
        PRE_TREATMENT = "pre_treatment", "Pre-Treatment"
        INTRA_PROCEDURE = "intra_procedure", "During Procedure"
        POST_TREATMENT = "post_treatment", "Post-Treatment"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="vitals")
    context = models.CharField(max_length=20, choices=Context.choices)

    bp_systolic = models.PositiveIntegerField(null=True, blank=True)
    bp_diastolic = models.PositiveIntegerField(null=True, blank=True)
    pulse = models.PositiveIntegerField(null=True, blank=True)
    blood_sugar = models.PositiveIntegerField(null=True, blank=True)  # mg/dL
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)  # °F
    spo2 = models.PositiveIntegerField(null=True, blank=True)  # %
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    notes = models.TextField(blank=True)
    is_flagged = models.BooleanField(default=False, editable=False)
    flagged_reason = models.CharField(max_length=255, blank=True, editable=False)

    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def check_flags(self):
        """Simple threshold checks — runs automatically before save."""
        reasons = []
        if self.bp_systolic and (self.bp_systolic >= 140 or self.bp_systolic < 90):
            reasons.append("BP systolic out of normal range")
        if self.bp_diastolic and (self.bp_diastolic >= 90 or self.bp_diastolic < 60):
            reasons.append("BP diastolic out of normal range")
        if self.pulse and (self.pulse > 100 or self.pulse < 60):
            reasons.append("Pulse out of normal range")
        if self.blood_sugar and (self.blood_sugar > 180 or self.blood_sugar < 70):
            reasons.append("Blood sugar out of normal range")
        if self.spo2 and self.spo2 < 95:
            reasons.append("SpO2 below normal")
        self.is_flagged = bool(reasons)
        self.flagged_reason = "; ".join(reasons)

    def save(self, *args, **kwargs):
        self.check_flags()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient} — {self.context} @ {self.recorded_at}"