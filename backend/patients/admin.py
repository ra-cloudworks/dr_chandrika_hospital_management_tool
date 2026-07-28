from django.contrib import admin
from .models import Patient, Guardian, MedicalHistory, Allergy, FamilyLink

admin.site.register(Patient)
admin.site.register(Guardian)
admin.site.register(MedicalHistory)
admin.site.register(Allergy)
admin.site.register(FamilyLink)