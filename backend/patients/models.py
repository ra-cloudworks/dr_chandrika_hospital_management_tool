from django.db import models
from django.conf import settings


class Patient(models.Model):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        MERGED = "merged", "Merged"

    patient_code = models.CharField(max_length=20, unique=True, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default="India")
    preferred_language = models.CharField(max_length=50, blank=True)
    photo = models.ImageField(upload_to="patient_photos/", null=True, blank=True)

    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True)
    referral_source = models.CharField(max_length=100, blank=True)
    abha_id = models.CharField(max_length=50, null=True, blank=True)

    linked_user = models.OneToOneField(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="patient_profile",
    )
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL,
        related_name="patients_registered",
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    merged_into = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="merged_from"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.patient_code:
            last = Patient.objects.order_by("id").last()
            next_id = (last.id + 1) if last else 1
            self.patient_code = f"PT{next_id:05d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient_code} - {self.first_name} {self.last_name}"


class Guardian(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="guardians")
    name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=50)
    phone = models.CharField(max_length=15, blank=True)
    id_proof_type = models.CharField(max_length=50, blank=True)
    id_proof_number = models.CharField(max_length=50, blank=True)


class MedicalHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="medical_history")
    condition_name = models.CharField(max_length=150)
    diagnosed_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)


class Allergy(models.Model):
    class Severity(models.TextChoices):
        MILD = "mild", "Mild"
        MODERATE = "moderate", "Moderate"
        SEVERE = "severe", "Severe"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="allergies")
    allergen = models.CharField(max_length=150)
    reaction = models.CharField(max_length=255, blank=True)
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.MILD)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)


class FamilyLink(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="family_links")
    related_patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="linked_from")
    relationship = models.CharField(max_length=50)