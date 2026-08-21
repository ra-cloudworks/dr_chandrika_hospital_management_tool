from django.contrib import admin
from .models import PerioExam, PerioToothMeasurement, PerioSiteReading

class PerioToothMeasurementInline(admin.TabularInline):
    model = PerioToothMeasurement
    extra = 0

@admin.register(PerioExam)
class PerioExamAdmin(admin.ModelAdmin):
    list_display = ["patient", "exam_date", "performed_by", "created_at"]
    inlines = [PerioToothMeasurementInline]

admin.site.register(PerioToothMeasurement)
admin.site.register(PerioSiteReading)