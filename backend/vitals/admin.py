from django.contrib import admin
from .models import Vitals

@admin.register(Vitals)
class VitalsAdmin(admin.ModelAdmin):
    list_display = ["patient", "context", "bp_systolic", "bp_diastolic", "pulse", "is_flagged", "recorded_at"]
    list_filter = ["context", "is_flagged"]