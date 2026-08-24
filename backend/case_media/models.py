from django.db import models
from django.conf import settings
from patients.models import Patient
from case_files.models import Case


class MediaFile(models.Model):
    class MediaType(models.TextChoices):
        PHOTO = "photo", "Clinical Photo"
        XRAY = "xray", "X-Ray / Scan"
        DOCUMENT = "document", "Document"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="media_files")
    case = models.ForeignKey(Case, on_delete=models.SET_NULL, null=True, blank=True, related_name="media_files")
    tooth_number = models.CharField(max_length=5, blank=True)  # optional link to a specific tooth

    media_type = models.CharField(max_length=10, choices=MediaType.choices)
    # Free-text on purpose — suggested values differ by type:
    # photo: intraoral / extraoral / before / after
    # xray: iopa / opg / cbct / bitewing / lateral_ceph
    # document: consent_form / lab_report / referral / insurance / id_proof
    category = models.CharField(max_length=50, blank=True)

    file = models.FileField(upload_to="patient_media/%Y/%m/")
    caption = models.CharField(max_length=255, blank=True)

    version_number = models.PositiveSmallIntegerField(default=1)
    previous_version = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="next_versions"
    )
    is_current = models.BooleanField(default=True)

    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    deleted_at = models.DateTimeField(null=True, blank=True)
    deletion_reason = models.CharField(max_length=255, blank=True)

    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="+")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient} — {self.media_type} v{self.version_number}"