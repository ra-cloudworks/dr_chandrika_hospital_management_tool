from django.db import models
from django.conf import settings
from patients.models import Patient


class Chair(models.Model):
    name = models.CharField(max_length=50)  # e.g. "Chair 1", "Room A"
    location = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class DoctorSchedule(models.Model):
    """Recurring weekly working hours — e.g. 'Dr. Kumar works Mon 9am-1pm, 30-min slots'."""
    DAYS = [(0, "Monday"), (1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"),
            (4, "Friday"), (5, "Saturday"), (6, "Sunday")]

    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="schedules")
    day_of_week = models.PositiveSmallIntegerField(choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveSmallIntegerField(default=30)
    default_chair = models.ForeignKey(Chair, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ["doctor", "day_of_week", "start_time"]

    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class ScheduleBlock(models.Model):
    """One-off blocked time — leave, holiday, chair under maintenance, etc."""
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="schedule_blocks")
    chair = models.ForeignKey(Chair, on_delete=models.CASCADE, null=True, blank=True, related_name="schedule_blocks")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    reason = models.CharField(max_length=200, blank=True)


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending Confirmation"
        CONFIRMED = "confirmed", "Confirmed"
        CHECKED_IN = "checked_in", "Checked In"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        NO_SHOW = "no_show", "No Show"

    class Source(models.TextChoices):
        PATIENT_PORTAL = "patient_portal", "Patient Portal"
        RECEPTIONIST = "receptionist", "Receptionist"
        PUBLIC_REQUEST = "public_request", "Website Request"
        WALK_IN = "walk_in", "Walk-In"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, null=True, blank=True, related_name="appointments")
    # Guest fields — used only for a public website request before a real Patient exists
    guest_name = models.CharField(max_length=150, blank=True)
    guest_phone = models.CharField(max_length=15, blank=True)
    guest_email = models.EmailField(blank=True)  # Contact email for guest public appointment requests

    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments_as_doctor")
    chair = models.ForeignKey(Chair, on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments")

    appointment_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    source = models.CharField(max_length=20, choices=Source.choices)

    is_home_visit = models.BooleanField(default=False)
    home_visit_address = models.TextField(blank=True)

    reason_for_visit = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    
    # Cancellation & No-Show tracking fields for clinical auditing
    cancellation_reason = models.CharField(max_length=100, blank=True)
    cancellation_notes = models.TextField(blank=True)

    token_number = models.PositiveIntegerField(null=True, blank=True, editable=False)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="appointments_created")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Token number is only assigned once a slot is actually locked in —
        # a pending website request doesn't get one yet.
        if not self.token_number and self.status in ["confirmed", "checked_in"]:
            same_day = Appointment.objects.filter(
                doctor=self.doctor, appointment_date=self.appointment_date
            ).exclude(status="cancelled").count()
            self.token_number = same_day + 1
        super().save(*args, **kwargs)

    def __str__(self):
        who = self.patient or self.guest_name
        return f"{who} with {self.doctor} on {self.appointment_date} {self.start_time}"


class Waitlist(models.Model):
    class Status(models.TextChoices):
        WAITING = "waiting", "Waiting"
        NOTIFIED = "notified", "Notified"
        BOOKED = "booked", "Booked"
        EXPIRED = "expired", "Expired"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="waitlist_entries")
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="waitlist_entries")
    preferred_date = models.DateField()
    preferred_time_of_day = models.CharField(max_length=20, blank=True)  # "morning" / "afternoon" / "evening"
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.WAITING)
    created_at = models.DateTimeField(auto_now_add=True)


class AppointmentRescheduleLog(models.Model):
    """Logs history of date, time, or doctor changes when an appointment is rescheduled."""
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name="reschedule_logs")
    old_date = models.DateField()
    old_start_time = models.TimeField()
    old_end_time = models.TimeField()
    old_doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reschedule_logs_old")
    new_date = models.DateField()
    new_start_time = models.TimeField()
    new_end_time = models.TimeField()
    new_doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reschedule_logs_new")
    reason = models.TextField()
    rescheduled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="reschedules_performed")
    rescheduled_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reschedule for Appt #{self.appointment_id} on {self.rescheduled_at.strftime('%Y-%m-%d %H:%M')}"


class RecallReminder(models.Model):
    """Tracks future recall/repeat visits due for a patient (e.g. 6-month cleaning/checkup)."""
    class RecallType(models.TextChoices):
        CLEANING = "cleaning", "Cleaning"
        CHECKUP = "checkup", "Checkup"
        ORTHODONTIC_REVIEW = "orthodontic_review", "Orthodontic Review"
        POST_TREATMENT_REVIEW = "post_treatment_review", "Post-Treatment Review"
        CUSTOM = "custom", "Custom"

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        NOTIFIED = "notified", "Notified"
        BOOKED = "booked", "Booked"
        EXPIRED = "expired", "Expired"
        CANCELLED = "cancelled", "Cancelled"

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="recall_reminders")
    recall_type = models.CharField(max_length=30, choices=RecallType.choices)
    custom_reason = models.CharField(max_length=255, blank=True)
    recall_date = models.DateField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="recalls_created")
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    linked_appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name="linked_recalls")
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Recall for {self.patient} on {self.recall_date} ({self.get_recall_type_display()})"