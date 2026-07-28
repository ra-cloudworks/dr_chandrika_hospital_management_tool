from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CHIEF_DOCTOR = "chief_doctor", "Chief Doctor"
        DOCTOR = "doctor", "Doctor"
        ASSISTANT = "assistant", "Assistant"
        RECEPTIONIST = "receptionist", "Receptionist"
        ACCOUNTANT = "accountant", "Accountant"
        PATIENT = "patient", "Patient"

    role = models.CharField(max_length=20, choices=Role.choices)
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    photo = models.ImageField(upload_to="user_photos/", null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=[("active", "Active"), ("inactive", "Inactive")],
        default="active",
    )
    mfa_enabled = models.BooleanField(default=False)
    biometric_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_history")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=255, null=True, blank=True)
    login_at = models.DateTimeField(auto_now_add=True)
    logout_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="success")


class OTPVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otp_verifications")
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=50)  # login, password_reset, sensitive_action
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="audit_logs")
    action = models.CharField(max_length=50)     # create, update, delete, view
    module = models.CharField(max_length=50)     # e.g. "patient", "billing"
    record_id = models.CharField(max_length=50, null=True, blank=True)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)