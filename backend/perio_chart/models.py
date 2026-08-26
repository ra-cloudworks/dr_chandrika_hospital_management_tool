from django.db import models
from django.conf import settings
from patients.models import Patient


class PerioExam(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="perio_exams")
    exam_date = models.DateField(auto_now_add=True)
    diagnosis_summary = models.TextField(blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} — Perio exam {self.exam_date}"


class PerioToothMeasurement(models.Model):
    exam = models.ForeignKey(PerioExam, on_delete=models.CASCADE, related_name="tooth_measurements")
    tooth_number = models.CharField(max_length=5)  # FDI notation, e.g. "36"
    mobility_grade = models.PositiveSmallIntegerField(default=0)  # 0-3
    furcation_grade = models.PositiveSmallIntegerField(default=0)  # 0-3
    plaque_present = models.BooleanField(default=False)
    calculus_present = models.BooleanField(default=False)

    def __str__(self):
        return f"Tooth {self.tooth_number} ({self.exam_id})"


class PerioSiteReading(models.Model):
    class Site(models.TextChoices):
        MESIOBUCCAL = "mesiobuccal", "Mesiobuccal"
        BUCCAL = "buccal", "Buccal"
        DISTOBUCCAL = "distobuccal", "Distobuccal"
        MESIOLINGUAL = "mesiolingual", "Mesiolingual"
        LINGUAL = "lingual", "Lingual"
        DISTOLINGUAL = "distolingual", "Distolingual"

    tooth_measurement = models.ForeignKey(PerioToothMeasurement, on_delete=models.CASCADE, related_name="site_readings")
    site = models.CharField(max_length=15, choices=Site.choices)
    pocket_depth_mm = models.PositiveSmallIntegerField()
    recession_mm = models.SmallIntegerField(default=0)  # can be negative in rare cases
    bleeding_on_probing = models.BooleanField(default=False)
    suppuration = models.BooleanField(default=False)