from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, LoginHistory, OTPVerification, AuditLog

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ("username", "email", "role", "status", "is_active")
    fieldsets = UserAdmin.fieldsets + (
        ("Clinic Info", {"fields": ("role", "phone", "photo", "status", "mfa_enabled", "biometric_enabled")}),
    )

admin.site.register(User, CustomUserAdmin)
admin.site.register(LoginHistory)
admin.site.register(OTPVerification)
admin.site.register(AuditLog)