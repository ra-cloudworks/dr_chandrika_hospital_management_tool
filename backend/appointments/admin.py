from django.contrib import admin
from .models import Chair, DoctorSchedule, ScheduleBlock, Appointment, Waitlist

admin.site.register(Chair)
admin.site.register(DoctorSchedule)
admin.site.register(ScheduleBlock)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["patient", "guest_name", "doctor", "appointment_date", "start_time", "status", "source", "token_number"]
    list_filter = ["status", "source"]

admin.site.register(Waitlist)