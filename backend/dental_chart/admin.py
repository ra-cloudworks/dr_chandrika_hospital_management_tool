from django.contrib import admin
from .models import ToothRecord, EndodonticDetail, ImplantDetail, OrthodonticDetail, ToothRecordHistory

@admin.register(ToothRecord)
class ToothRecordAdmin(admin.ModelAdmin):
    list_display = ["patient", "tooth_number", "condition", "status", "recorded_at"]
    list_filter = ["condition", "status", "dentition_type"]

admin.site.register(EndodonticDetail)
admin.site.register(ImplantDetail)
admin.site.register(OrthodonticDetail)
admin.site.register(ToothRecordHistory)