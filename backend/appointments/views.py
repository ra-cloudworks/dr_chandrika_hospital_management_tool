from datetime import datetime, timedelta
import logging
from django.core.mail import send_mail
from rest_framework import generics, views, permissions, status, serializers
from rest_framework.response import Response
from .models import Appointment, Chair, DoctorSchedule, ScheduleBlock, Waitlist, AppointmentRescheduleLog, RecallReminder
from .serializers import (
    AppointmentSerializer, ChairSerializer, DoctorScheduleSerializer,
    PublicAppointmentRequestSerializer, ConfirmRequestSerializer, DeclineRescheduleSerializer,
    WaitlistSerializer, PublicDoctorSerializer, RescheduleSerializer, RecallReminderSerializer,
    WalkInSerializer
)
from .permissions import AppointmentPermission, StaffOnlyPermission, RecallPermission
from accounts.models import User
from patients.models import Patient

logger = logging.getLogger(__name__)


class ChairListCreateView(generics.ListCreateAPIView):
    queryset = Chair.objects.all()
    serializer_class = ChairSerializer
    permission_classes = [StaffOnlyPermission]


class DoctorScheduleListCreateView(generics.ListCreateAPIView):
    serializer_class = DoctorScheduleSerializer
    permission_classes = [StaffOnlyPermission]

    def get_queryset(self):
        qs = DoctorSchedule.objects.all()
        doctor_id = self.request.query_params.get("doctor_id")
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs


def compute_available_slots(doctor_id, target_date):
    """
    Shared helper utility to compute time slot availability for a doctor on a target date.
    Calculates 30-min working slots minus existing bookings and schedule blocks.
    """
    schedules = DoctorSchedule.objects.filter(doctor_id=doctor_id, day_of_week=target_date.weekday())
    if not schedules.exists():
        return []

    # Include completed appointments as booked time slots to prevent double-booking
    booked = Appointment.objects.filter(
        doctor_id=doctor_id, appointment_date=target_date,
        status__in=["confirmed", "checked_in", "in_progress", "completed"],
    ).values_list("start_time", "end_time")
    blocks = ScheduleBlock.objects.filter(doctor_id=doctor_id, date=target_date).values_list("start_time", "end_time")

    slots = []
    for sched in schedules:
        current = datetime.combine(target_date, sched.start_time)
        end_of_block = datetime.combine(target_date, sched.end_time)
        duration = timedelta(minutes=sched.slot_duration_minutes)

        while current + duration <= end_of_block:
            slot_start, slot_end = current.time(), (current + duration).time()
            taken = any(slot_start < b_end and slot_end > b_start for b_start, b_end in booked)
            blocked = any(slot_start < b_end and slot_end > b_start for b_start, b_end in blocks)
            is_available = not (taken or blocked)
            slots.append({
                "start_time": slot_start.strftime("%H:%M"),
                "end_time": slot_end.strftime("%H:%M"),
                "start_time_obj": slot_start,
                "end_time_obj": slot_end,
                "is_available": is_available,
                "reason": "Booked" if taken else ("Blocked" if blocked else "Available")
            })
            current += duration

    return slots


class AvailableSlotsView(views.APIView):
    """Computes time slots for a doctor on a date with availability status (free vs booked/blocked)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        doctor_id = request.query_params.get("doctor_id")
        date_str = request.query_params.get("date")
        if not doctor_id or not date_str:
            return Response({"detail": "doctor_id and date are required."}, status=400)

        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        slots = compute_available_slots(doctor_id, target_date)
        return Response({"slots": slots})


class AppointmentListCreateView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [AppointmentPermission]

    def get_queryset(self):
        user = self.request.user
        # Exclude pending website requests from daily appointments schedule view
        qs = Appointment.objects.all().exclude(status="pending").order_by("appointment_date", "start_time")
        if user.role == "patient":
            return qs.filter(patient__linked_user=user)
        for param, field in [("patient_id", "patient_id"), ("doctor_id", "doctor_id"), ("date", "appointment_date")]:
            value = self.request.query_params.get(param)
            if value:
                qs = qs.filter(**{field: value})
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "patient":
            serializer.save(patient=user.patient_profile, status="confirmed", source="patient_portal", created_by=user)
        else:
            serializer.save(status="confirmed", source="receptionist", created_by=user)


class AppointmentDetailView(generics.RetrieveUpdateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [AppointmentPermission]


class PublicAppointmentRequestView(generics.CreateAPIView):
    """No login required — this is the 'Book Appointment' form on the public website."""
    serializer_class = PublicAppointmentRequestSerializer
    permission_classes = [permissions.AllowAny]


class PendingRequestsListView(generics.ListAPIView):
    """Receptionist's inbox of website requests awaiting confirmation."""
    serializer_class = AppointmentSerializer
    permission_classes = [StaffOnlyPermission]

    def get_queryset(self):
        return Appointment.objects.filter(status="pending", source="public_request").order_by("created_at")


class ConfirmRequestView(views.APIView):
    """Receptionist confirms a pending website request. Auto-registers or links patient, assigns doctor and time slot."""
    permission_classes = [StaffOnlyPermission]

    def post(self, request, pk):
        try:
            appt = Appointment.objects.get(pk=pk, status="pending")
        except Appointment.DoesNotExist:
            return Response({"detail": "Pending appointment request not found."}, status=status.HTTP_444_NOT_FOUND if hasattr(status, 'HTTP_444') else 404)

        serializer = ConfirmRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        doctor_id = data["doctor_id"]

        # Validate that the selected doctor has a schedule configured on this weekday
        day_name = appt.appointment_date.strftime("%A")
        has_schedule = DoctorSchedule.objects.filter(doctor_id=doctor_id, day_of_week=appt.appointment_date.weekday()).exists()
        if not has_schedule:
            try:
                doctor_user = User.objects.get(pk=doctor_id)
                doc_name = f"Dr. {doctor_user.get_full_name()}"
            except User.DoesNotExist:
                doc_name = "Selected doctor"
            return Response(
                {"detail": f"{doc_name} is not scheduled to work on {day_name} ({appt.appointment_date}). Please choose another doctor or offer alternative slots."},
                status=400
            )

        # 1. Automatic Patient Lookup or Registration
        patient = None
        patient_id = data.get("patient_id")
        if patient_id:
            try:
                patient = Patient.objects.get(pk=patient_id)
            except Patient.DoesNotExist:
                return Response({"detail": f"Patient with ID {patient_id} does not exist."}, status=400)
        elif appt.guest_phone:
            # Check if patient exists by phone number
            patient = Patient.objects.filter(phone=appt.guest_phone).first()

        if not patient:
            # Automatically create a new Patient record for this guest
            name_parts = (appt.guest_name or "Guest Patient").strip().split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            patient = Patient.objects.create(
                first_name=first_name,
                last_name=last_name,
                phone=appt.guest_phone,
                email=appt.guest_email,
                registered_by=request.user
            )

        # 2. Update appointment fields
        appt.patient = patient
        appt.doctor_id = doctor_id
        
        start_time = data.get("start_time") or appt.start_time
        appt.start_time = start_time

        if data.get("end_time"):
            appt.end_time = data["end_time"]
        else:
            # Default slot duration 30 minutes
            start_dt = datetime.combine(appt.appointment_date, start_time)
            appt.end_time = (start_dt + timedelta(minutes=30)).time()

        if data.get("chair_id"):
            appt.chair_id = data["chair_id"]

        appt.status = "confirmed"
        appt.save()

        # =========================================================================
        # TODO: EMAIL INTEGRATION SERVICE
        # Connect your production SMTP or transactional email provider (SendGrid/AWS SES/Resend) here.
        # Payload Template:
        # Recipient: appt.guest_email or (patient.email if patient else None)
        # Subject: "Appointment Confirmed - Dr. Chandrika Hospital"
        # Body: "Dear {patient_name}, your appointment on {date} at {start_time} with Dr. {doctor_name} is confirmed."
        # =========================================================================
        # recipient_email = appt.guest_email or (patient.email if patient else None)
        # if recipient_email:
        #     try:
        #         subject = "Appointment Confirmation - Dr. Chandrika Hospital"
        #         doc_name = appt.doctor.get_full_name() if appt.doctor else "our specialist"
        #         message = (
        #             f"Dear {appt.patient.first_name if appt.patient else appt.guest_name},\n\n"
        #             f"Your appointment has been confirmed!\n\n"
        #             f"Date: {appt.appointment_date}\n"
        #             f"Time: {appt.start_time} - {appt.end_time}\n"
        #             f"Doctor: Dr. {doc_name}\n"
        #             f"Token Number: #{appt.token_number}\n\n"
        #             f"Please arrive 10 minutes prior to your scheduled time.\n\n"
        #             f"Best regards,\nDr. Chandrika Hospital Team"
        #         )
        #         send_mail(subject, message, getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@hospital.com"), [recipient_email], fail_silently=True)
        #     except Exception as e:
        #         logger.error(f"Confirmation email failed: {e}")

        return Response(AppointmentSerializer(appt).data)


class DeclineOrRescheduleRequestView(views.APIView):
    """Receptionist declines a website request or offers alternative slots via email."""
    permission_classes = [StaffOnlyPermission]

    def post(self, request, pk):
        try:
            appt = Appointment.objects.get(pk=pk, status="pending")
        except Appointment.DoesNotExist:
            return Response({"detail": "Pending request not found."}, status=404)

        serializer = DeclineRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        action = data.get("action", "decline")
        reason = data.get("reason", "The requested time slot is no longer available.")
        alternative_slots = data.get("alternative_slots", [])

        # Mark appointment as cancelled
        appt.status = "cancelled"
        appt.notes = f"Declined by staff. Reason: {reason}"
        appt.save()

        # =========================================================================
        # TODO: EMAIL INTEGRATION SERVICE
        # Connect your production SMTP or transactional email provider (SendGrid/AWS SES/Resend) here.
        # Triggers reschedule options or rejection notices to patient email.
        # =========================================================================
        # recipient_email = appt.guest_email or (appt.patient.email if appt.patient else None)
        # if recipient_email:
        #     subject = "Update regarding your appointment request - Dr. Chandrika Hospital"
        #     if action == "reschedule_offer" and alternative_slots:
        #         slots_text = "\n".join([f"- {s}" for s in alternative_slots])
        #         message = (
        #             f"Dear {appt.guest_name or 'Patient'},\n\n"
        #             f"Thank you for requesting an appointment on {appt.appointment_date} at {appt.start_time}.\n"
        #             f"Unfortunately, that slot is already filled or unavailable.\n\n"
        #             f"Available alternative slots on that day:\n{slots_text}\n\n"
        #             f"Please reply to this email or contact us to confirm your preferred timing.\n\n"
        #             f"Best regards,\nReception Team"
        #         )
        #     else:
        #         message = (
        #             f"Dear {appt.guest_name or 'Patient'},\n\n"
        #             f"We regret to inform you that your appointment request for {appt.appointment_date} at {appt.start_time} "
        #             f"could not be confirmed.\nReason: {reason}\n\n"
        #             f"Please visit our website or contact us to choose another date.\n\n"
        #             f"Best regards,\nReception Team"
        #         )
        #     try:
        #         send_mail(
        #             subject, message,
        #             getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@hospital.com"),
        #             [recipient_email],
        #             fail_silently=True
        #         )
        #     except Exception as e:
        #         logger.error(f"Failed to send appointment decline email: {e}")

        return Response({
            "detail": "Request updated successfully and patient notified.",
            "appointment": AppointmentSerializer(appt).data
        })



class WalkInAppointmentView(views.APIView):
    """
    Fast-track queueing for walk-in patients on the current day.
    Auto-selects doctor and earliest available slot if doctor is not specified.
    """
    permission_classes = [StaffOnlyPermission]

    def post(self, request):
        serializer = WalkInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # 1. Resolve Patient (Existing or Auto-Registered)
        patient = None
        patient_id = data.get("patient_id")
        if patient_id:
            try:
                patient = Patient.objects.get(pk=patient_id)
            except Patient.DoesNotExist:
                return Response({"detail": f"Patient with ID {patient_id} does not exist."}, status=400)
        else:
            guest_name = (data.get("guest_name") or "").strip()
            guest_phone = (data.get("guest_phone") or "").strip()
            patient = Patient.objects.filter(phone=guest_phone).first()
            if not patient:
                name_parts = (guest_name or "Walk-In Patient").split(" ", 1)
                first_name = name_parts[0]
                last_name = name_parts[1] if len(name_parts) > 1 else ""
                patient = Patient.objects.create(
                    first_name=first_name,
                    last_name=last_name,
                    phone=guest_phone,
                    registered_by=request.user
                )

        today = datetime.now().date()
        doctor_id = data.get("doctor_id")

        assigned_doctor = None
        selected_slot = None

        if doctor_id:
            try:
                assigned_doctor = User.objects.get(pk=doctor_id, role__in=["doctor", "chief_doctor"], status="active")
            except User.DoesNotExist:
                return Response({"detail": f"Doctor with ID {doctor_id} does not exist or is inactive."}, status=400)

            has_schedule = DoctorSchedule.objects.filter(doctor=assigned_doctor, day_of_week=today.weekday()).exists()
            if not has_schedule:
                return Response(
                    {"detail": f"Dr. {assigned_doctor.get_full_name()} has no scheduled working hours today. Consider adding to waitlist."},
                    status=409
                )

            slots = compute_available_slots(assigned_doctor.id, today)
            free_slots = [s for s in slots if s["is_available"]]
            if not free_slots:
                return Response(
                    {"detail": f"No available slots today for Dr. {assigned_doctor.get_full_name()}. Consider adding to waitlist."},
                    status=409
                )
            selected_slot = free_slots[0]
        else:
            # Auto-assign: scan all active doctors with working schedules today
            doctors = User.objects.filter(role__in=["doctor", "chief_doctor"], status="active")
            candidate_options = []

            for doc in doctors:
                slots = compute_available_slots(doc.id, today)
                free_slots = [s for s in slots if s["is_available"]]
                if free_slots:
                    earliest_slot = free_slots[0]
                    load_count = Appointment.objects.filter(
                        doctor=doc, appointment_date=today,
                        status__in=["confirmed", "checked_in", "in_progress", "completed"]
                    ).count()
                    candidate_options.append({
                        "doctor": doc,
                        "slot": earliest_slot,
                        "start_time_obj": earliest_slot["start_time_obj"],
                        "load_count": load_count
                    })

            if not candidate_options:
                return Response(
                    {"detail": "No available slots today for any doctor. Consider adding to waitlist."},
                    status=409
                )

            candidate_options.sort(key=lambda x: (x["start_time_obj"], x["load_count"]))
            assigned_doctor = candidate_options[0]["doctor"]
            selected_slot = candidate_options[0]["slot"]

        # Create confirmed walk-in appointment
        appt = Appointment.objects.create(
            patient=patient,
            doctor=assigned_doctor,
            appointment_date=today,
            start_time=selected_slot["start_time_obj"],
            end_time=selected_slot["end_time_obj"],
            status="confirmed",
            source="walk_in",
            reason_for_visit=data.get("reason_for_visit", "Walk-In Consultation"),
            created_by=request.user
        )

        return Response(AppointmentSerializer(appt).data, status=status.HTTP_201_CREATED)


class AppointmentActionView(views.APIView):
    """Handles check-in / start / complete / cancel / no-show status transitions and cancellation auditing."""
    permission_classes = [AppointmentPermission]

    def post(self, request, pk, action):
        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({"detail": "Appointment not found."}, status=404)

        self.check_object_permissions(request, appt)
        valid_actions = {
            "check-in": "checked_in", "start": "in_progress", "complete": "completed",
            "cancel": "cancelled", "no-show": "no_show",
        }
        if action not in valid_actions:
            return Response({"detail": "Invalid action."}, status=400)

        appt.status = valid_actions[action]

        # Capture cancellation reason and notes for audit tracking when cancelling or marking no-show
        if action in ["cancel", "no-show"]:
            reason = request.data.get("cancellation_reason", "")
            notes = request.data.get("cancellation_notes", "")
            if reason:
                appt.cancellation_reason = reason
            if notes:
                appt.cancellation_notes = notes

        appt.save()
        return Response(AppointmentSerializer(appt).data)


class WaitlistListCreateView(generics.ListCreateAPIView):
    serializer_class = WaitlistSerializer
    permission_classes = [AppointmentPermission]

    def get_queryset(self):
        user = self.request.user
        if user.role == "patient":
            return Waitlist.objects.filter(patient__linked_user=user)
        return Waitlist.objects.all().order_by("preferred_date")

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == "patient":
            serializer.save(patient=user.patient_profile)
        else:
            serializer.save()

class PublicDoctorListView(generics.ListAPIView):
    """Lists active doctors by name only — no login required, since the
    public website booking form needs this before a visitor has an account."""
    serializer_class = PublicDoctorSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return User.objects.filter(role__in=["doctor", "chief_doctor"], status="active").order_by("first_name")


class RescheduleAppointmentView(views.APIView):
    """
    Moves a confirmed or checked_in appointment to a new date, time, or doctor slot.
    Logs the old date/time/doctor values in AppointmentRescheduleLog prior to updating.
    """
    permission_classes = [AppointmentPermission]

    def post(self, request, pk):
        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({"detail": "Appointment not found."}, status=404)

        self.check_object_permissions(request, appt)

        if appt.status not in ["confirmed", "checked_in"]:
            return Response(
                {"detail": "Only confirmed or checked_in appointments can be rescheduled."},
                status=400
            )

        serializer = RescheduleSerializer(data=request.data, context={"appointment": appt})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        new_date = data["new_date"]
        new_start_time = data["new_start_time"]
        new_end_time = data["new_end_time"]
        new_doctor = data.get("resolved_doctor") or appt.doctor
        reason = data["reason"]

        # Create audit log record before updating appointment fields
        AppointmentRescheduleLog.objects.create(
            appointment=appt,
            old_date=appt.appointment_date,
            old_start_time=appt.start_time,
            old_end_time=appt.end_time,
            old_doctor=appt.doctor,
            new_date=new_date,
            new_start_time=new_start_time,
            new_end_time=new_end_time,
            new_doctor=new_doctor,
            reason=reason,
            rescheduled_by=request.user,
        )

        # Update appointment details; status remains confirmed / checked_in
        appt.appointment_date = new_date
        appt.start_time = new_start_time
        appt.end_time = new_end_time
        appt.doctor = new_doctor
        appt.save()

        return Response(AppointmentSerializer(appt).data)


class RecallReminderListCreateView(generics.ListCreateAPIView):
    """
    Handles listing and creating recall reminders.
    Supports filtering by patient_id, status, and due_soon (recalls due in next 30 days).
    """
    serializer_class = RecallReminderSerializer
    permission_classes = [RecallPermission]

    def get_queryset(self):
        user = self.request.user
        qs = RecallReminder.objects.all()

        if user.role == "patient":
            qs = qs.filter(patient__linked_user=user)
        else:
            patient_id = self.kwargs.get("patient_id") or self.request.query_params.get("patient_id")
            if patient_id:
                qs = qs.filter(patient_id=patient_id)

            status_param = self.request.query_params.get("status")
            if status_param:
                qs = qs.filter(status=status_param)

            due_soon = self.request.query_params.get("due_soon")
            if due_soon and due_soon.lower() == "true":
                today = datetime.now().date()
                next_30 = today + timedelta(days=30)
                qs = qs.filter(recall_date__range=(today, next_30), status="scheduled")

        return qs.order_by("recall_date")

    def perform_create(self, serializer):
        patient_id = self.kwargs.get("patient_id") or self.request.data.get("patient")
        if not patient_id:
            raise serializers.ValidationError({"patient": "Patient ID is required."})
        serializer.save(patient_id=patient_id, created_by=self.request.user)