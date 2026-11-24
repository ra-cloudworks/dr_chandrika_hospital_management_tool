from django.contrib import admin
from .models import Chair, DoctorSchedule, ScheduleBlock, Appointment, Waitlist, AppointmentRescheduleLog, RecallReminder

admin.site.register(Chair)
admin.site.register(DoctorSchedule)
admin.site.register(ScheduleBlock)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["patient", "guest_name", "doctor", "appointment_date", "start_time", "status", "source", "token_number"]
    list_filter = ["status", "source"]

admin.site.register(Waitlist)

@admin.register(AppointmentRescheduleLog)
class AppointmentRescheduleLogAdmin(admin.ModelAdmin):
    list_display = ["appointment", "old_date", "old_start_time", "new_date", "new_start_time", "rescheduled_by", "rescheduled_at"]
    list_filter = ["rescheduled_at"]

@admin.register(RecallReminder)
class RecallReminderAdmin(admin.ModelAdmin):
    list_display = ["patient", "recall_type", "recall_date", "status", "created_by", "created_at"]
    list_filter = ["status", "recall_type"]