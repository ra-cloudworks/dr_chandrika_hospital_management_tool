from rest_framework import serializers
from .models import Appointment, Chair, DoctorSchedule, ScheduleBlock, Waitlist, AppointmentRescheduleLog, RecallReminder
from accounts.models import User


def validate_appointment_conflict(doctor, date, start, end, chair=None, exclude_appt_id=None):
    """
    Shared helper method to prevent double-booking. Validates doctor schedule blocks
    and overlapping confirmed/checked-in appointments.
    """
    if doctor and date and start and end:
        # Block against declared leave/holiday time
        for block in ScheduleBlock.objects.filter(doctor=doctor, date=date):
            if start < block.end_time and end > block.start_time:
                raise serializers.ValidationError("This time is blocked (leave/holiday) for the selected doctor.")

        # Block against an already-booked overlapping appointment for this doctor
        conflicts = Appointment.objects.filter(
            doctor=doctor, appointment_date=date, status__in=["confirmed", "checked_in", "in_progress"],
        )
        if exclude_appt_id:
            conflicts = conflicts.exclude(pk=exclude_appt_id)

        for appt in conflicts:
            if start < appt.end_time and end > appt.start_time:
                raise serializers.ValidationError("This doctor already has an appointment in that time slot.")
            if chair and appt.chair_id == getattr(chair, "id", chair):
                if start < appt.end_time and end > appt.start_time:
                    raise serializers.ValidationError("This chair is already booked in that time slot.")


class ChairSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chair
        fields = ["id", "name", "location", "is_active"]


class DoctorScheduleSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = ["id", "doctor", "doctor_name", "day_of_week", "start_time", "end_time", "slot_duration_minutes", "default_chair"]


class AppointmentRescheduleLogSerializer(serializers.ModelSerializer):
    """Serializes historical audit records of appointment reschedules."""
    old_doctor_name = serializers.CharField(source="old_doctor.get_full_name", read_only=True)
    new_doctor_name = serializers.CharField(source="new_doctor.get_full_name", read_only=True)
    rescheduled_by_name = serializers.CharField(source="rescheduled_by.get_full_name", read_only=True)

    class Meta:
        model = AppointmentRescheduleLog
        fields = [
            "id", "appointment", "old_date", "old_start_time", "old_end_time", "old_doctor", "old_doctor_name",
            "new_date", "new_start_time", "new_end_time", "new_doctor", "new_doctor_name",
            "reason", "rescheduled_by", "rescheduled_by_name", "rescheduled_at",
        ]
        read_only_fields = fields


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.CharField(source="doctor.get_full_name", read_only=True)
    chair_name = serializers.CharField(source="chair.name", read_only=True)
    reschedule_logs = AppointmentRescheduleLogSerializer(many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id", "patient", "patient_name", "guest_name", "guest_phone", "guest_email",
            "doctor", "doctor_name", "chair", "chair_name",
            "appointment_date", "start_time", "end_time", "status", "source",
            "is_home_visit", "home_visit_address", "reason_for_visit", "notes",
            "cancellation_reason", "cancellation_notes",
            "token_number", "reschedule_logs", "created_at",
        ]
        read_only_fields = ["status", "source", "token_number", "created_at"]

    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name}"
        return obj.guest_name

    def validate_doctor(self, value):
        if value and value.role not in ["doctor", "chief_doctor"]:
            raise serializers.ValidationError("Selected user is not a doctor.")
        return value

    def validate(self, attrs):
        doctor = attrs.get("doctor") or getattr(self.instance, "doctor", None)
        date = attrs.get("appointment_date") or getattr(self.instance, "appointment_date", None)
        start = attrs.get("start_time") or getattr(self.instance, "start_time", None)
        end = attrs.get("end_time") or getattr(self.instance, "end_time", None)
        chair = attrs.get("chair") or getattr(self.instance, "chair", None)

        validate_appointment_conflict(
            doctor=doctor, date=date, start=start, end=end, chair=chair,
            exclude_appt_id=getattr(self.instance, "pk", None)
        )
        return attrs


class RescheduleSerializer(serializers.Serializer):
    """Validates parameters for moving an appointment to a new date/time/doctor."""
    new_date = serializers.DateField(required=True)
    new_start_time = serializers.TimeField(required=True)
    new_end_time = serializers.TimeField(required=True)
    new_doctor_id = serializers.IntegerField(required=False, allow_null=True)
    reason = serializers.CharField(required=True, allow_blank=False)

    def validate(self, attrs):
        appt = self.context.get("appointment")
        doctor_id = attrs.get("new_doctor_id")

        if doctor_id:
            try:
                doctor = User.objects.get(pk=doctor_id, role__in=["doctor", "chief_doctor"])
            except User.DoesNotExist:
                raise serializers.ValidationError({"new_doctor_id": "Invalid doctor ID."})
        else:
            doctor = appt.doctor if appt else None

        date = attrs.get("new_date")
        start = attrs.get("new_start_time")
        end = attrs.get("new_end_time")
        chair = getattr(appt, "chair", None) if appt else None

        validate_appointment_conflict(
            doctor=doctor,
            date=date,
            start=start,
            end=end,
            chair=chair,
            exclude_appt_id=getattr(appt, "pk", None)
        )

        attrs["resolved_doctor"] = doctor
        return attrs


class RecallReminderSerializer(serializers.ModelSerializer):
    """Serializes recall reminder entries with patient and creator details."""
    patient_name = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = RecallReminder
        fields = [
            "id", "patient", "patient_name", "recall_type",
            "custom_reason", "recall_date", "created_by", "created_by_name",
            "created_at", "status", "linked_appointment", "notes"
        ]
        read_only_fields = ["patient", "status", "linked_appointment", "created_at", "created_by"]

    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name}"
        return ""


class PublicAppointmentRequestSerializer(serializers.ModelSerializer):
    guest_email = serializers.EmailField(required=True)
    doctor = serializers.PrimaryKeyRelatedField(
        queryset=Appointment._meta.get_field("doctor").remote_field.model.objects.filter(role__in=["doctor", "chief_doctor"]),
        required=False, allow_null=True
    )

    class Meta:
        model = Appointment
        fields = [
            "guest_name", "guest_phone", "guest_email", "doctor",
            "appointment_date", "start_time", "reason_for_visit",
            "is_home_visit", "home_visit_address"
        ]

    def create(self, validated_data):
        validated_data["status"] = "pending"
        validated_data["source"] = "public_request"
        # Real end_time gets set by receptionist when confirming request
        if "start_time" in validated_data:
            validated_data["end_time"] = validated_data["start_time"]
        return Appointment.objects.create(**validated_data)


class ConfirmRequestSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField(required=True)
    patient_id = serializers.IntegerField(required=False, allow_null=True)
    start_time = serializers.TimeField(required=False, allow_null=True)
    end_time = serializers.TimeField(required=False, allow_null=True)
    chair_id = serializers.IntegerField(required=False, allow_null=True)


class DeclineRescheduleSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["decline", "reschedule_offer"], default="decline")
    reason = serializers.CharField(required=False, allow_blank=True)
    alternative_slots = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )


class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Waitlist
        fields = ["id", "patient", "doctor", "preferred_date", "preferred_time_of_day", "notes", "status", "created_at"]
        read_only_fields = ["status", "created_at"]

class PublicDoctorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()


class WalkInSerializer(serializers.Serializer):
    """Validates fast-track walk-in appointment payload for receptionist queueing."""
    patient_id = serializers.IntegerField(required=False, allow_null=True)
    guest_name = serializers.CharField(required=False, allow_blank=True)
    guest_phone = serializers.CharField(required=False, allow_blank=True)
    doctor_id = serializers.IntegerField(required=False, allow_null=True)
    reason_for_visit = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        patient_id = attrs.get("patient_id")
        guest_name = (attrs.get("guest_name") or "").strip()
        guest_phone = (attrs.get("guest_phone") or "").strip()

        if not patient_id and not (guest_name and guest_phone):
            raise serializers.ValidationError(
                "Either an existing patient_id or both guest_name and guest_phone must be provided."
            )
        return attrs