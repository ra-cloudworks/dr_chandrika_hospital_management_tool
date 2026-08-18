from django.db import models
from django.conf import settings
from patients.models import Patient


class ToothRecord(models.Model):
    class Dentition(models.TextChoices):
        ADULT = "adult", "Adult (Permanent)"
        PRIMARY = "primary", "Primary (Milk teeth)"

    class Surface(models.TextChoices):
        MESIAL = "mesial", "Mesial"
        DISTAL = "distal", "Distal"
        OCCLUSAL = "occlusal", "Occlusal"
        BUCCAL = "buccal", "Buccal"
        LINGUAL = "lingual", "Lingual"
        INCISAL = "incisal", "Incisal"
        WHOLE = "whole", "Whole Tooth"

    class Condition(models.TextChoices):
        DECAY = "decay", "Decay"
        FILLING = "filling", "Filling"
        CROWN = "crown", "Crown"
        BRIDGE = "bridge", "Bridge"
        IMPLANT = "implant", "Implant"
        RCT = "rct", "Root Canal Treated"
        MISSING = "missing", "Missing"
        IMPACTED = "impacted", "Impacted"
        UNERUPTED = "unerupted", "Unerupted"
        SUPERNUMERARY = "supernumerary", "Supernumerary"
        FRACTURE = "fracture", "Fracture"
        MOBILITY = "mobility", "Mobility"
        SENSITIVITY = "sensitivity", "Sensitivity"
        HEALTHY = "healthy", "Healthy"

    class Status(models.TextChoices):
        EXISTING = "existing", "Existing"
        PLANNED = "planned", "Planned"
        COMPLETED = "completed", "Completed"
        REJECTED = "rejected", "Rejected"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="tooth_records")
    dentition_type = models.CharField(max_length=10, choices=Dentition.choices, default=Dentition.ADULT)
    tooth_number = models.CharField(max_length=5)  # FDI notation, e.g. "36"
    surface = models.CharField(max_length=10, choices=Surface.choices, default=Surface.WHOLE)
    condition = models.CharField(max_length=20, choices=Condition.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.EXISTING)
    notes = models.TextField(blank=True)

    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient} — Tooth {self.tooth_number} ({self.condition})"


class EndodonticDetail(models.Model):
    tooth_record = models.OneToOneField(ToothRecord, on_delete=models.CASCADE, related_name="endodontic_detail")
    working_length_mm = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    canal_count = models.PositiveSmallIntegerField(null=True, blank=True)
    obturation_date = models.DateField(null=True, blank=True)
    technique_notes = models.TextField(blank=True)


class ImplantDetail(models.Model):
    tooth_record = models.OneToOneField(ToothRecord, on_delete=models.CASCADE, related_name="implant_detail")
    brand = models.CharField(max_length=100, blank=True)
    diameter_mm = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    length_mm = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    batch_number = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    placement_date = models.DateField(null=True, blank=True)
    bone_graft_material = models.CharField(max_length=150, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    warranty_months = models.PositiveSmallIntegerField(null=True, blank=True)


class OrthodonticDetail(models.Model):
    tooth_record = models.OneToOneField(ToothRecord, on_delete=models.CASCADE, related_name="orthodontic_detail")
    appliance_type = models.CharField(max_length=100, blank=True)
    bracket_type = models.CharField(max_length=100, blank=True)
    wire_size = models.CharField(max_length=50, blank=True)
    position_notes = models.TextField(blank=True)
    adjustment_date = models.DateField(null=True, blank=True)


class ToothRecordHistory(models.Model):
    tooth_record = models.ForeignKey(ToothRecord, on_delete=models.CASCADE, related_name="history")
    changed_field = models.CharField(max_length=50)
    old_value = models.CharField(max_length=255, blank=True)
    new_value = models.CharField(max_length=255, blank=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)