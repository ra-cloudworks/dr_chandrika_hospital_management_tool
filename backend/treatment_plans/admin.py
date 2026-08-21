from django.contrib import admin
from .models import TreatmentPlan, TreatmentPlanItem, TreatmentPlanRevisionLog

class TreatmentPlanItemInline(admin.TabularInline):
    model = TreatmentPlanItem
    extra = 0

@admin.register(TreatmentPlan)
class TreatmentPlanAdmin(admin.ModelAdmin):
    list_display = ["patient", "title", "status", "total_estimated_cost", "revision_number", "created_at"]
    list_filter = ["status"]
    inlines = [TreatmentPlanItemInline]

admin.site.register(TreatmentPlanItem)
admin.site.register(TreatmentPlanRevisionLog)