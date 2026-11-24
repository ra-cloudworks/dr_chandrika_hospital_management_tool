from django.contrib import admin
from .models import DentalLab, LabOrder, LabOrderStatusLog


class LabOrderStatusLogInline(admin.TabularInline):
    """
    Inline tabular display of status logs on the LabOrder admin page.
    """
    model = LabOrderStatusLog
    extra = 0
    readonly_fields = ("old_status", "new_status", "changed_by", "notes", "changed_at")
    can_delete = False


@admin.register(DentalLab)
class DentalLabAdmin(admin.ModelAdmin):
    list_display = ("name", "contact_person", "phone", "email", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "contact_person", "phone", "email")


@admin.register(LabOrder)
class LabOrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "patient",
        "work_type",
        "status",
        "lab",
        "promised_delivery_date",
        "doctor_acceptance",
    )
    list_filter = ("status", "work_type", "lab", "doctor_acceptance")
    search_fields = (
        "order_number",
        "patient__first_name",
        "patient__last_name",
        "patient__patient_code",
        "tooth_numbers",
        "shade",
        "material",
    )
    inlines = [LabOrderStatusLogInline]


@admin.register(LabOrderStatusLog)
class LabOrderStatusLogAdmin(admin.ModelAdmin):
    list_display = ("lab_order", "old_status", "new_status", "changed_by", "changed_at")
    list_filter = ("new_status", "old_status")
    search_fields = ("lab_order__order_number", "notes")
