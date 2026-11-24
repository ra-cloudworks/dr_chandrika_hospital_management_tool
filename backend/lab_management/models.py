from django.db import models
from django.conf import settings
from patients.models import Patient
from dental_chart.models import ToothRecord
from treatment_plans.models import TreatmentPlanItem


class DentalLab(models.Model):
    """
    Represents an external dental laboratory that fabricates crowns, bridges, dentures, and appliances.
    """
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class LabOrder(models.Model):
    """
    Represents a specific laboratory order placed for a patient's prosthetic work.
    Tracks status progression, delivery logistics, quality acceptance, and cost details.
    """
    WORK_TYPE_CHOICES = [
        ("crown", "Crown"),
        ("bridge", "Bridge"),
        ("denture", "Denture"),
        ("partial_denture", "Partial Denture"),
        ("implant_crown", "Implant Crown"),
        ("orthodontic_appliance", "Orthodontic Appliance"),
        ("night_guard", "Night Guard"),
        ("retainer", "Retainer"),
        ("veneer", "Veneer"),
        ("inlay_onlay", "Inlay/Onlay"),
        ("custom", "Custom"),
    ]

    IMPRESSION_TYPE_CHOICES = [
        ("physical", "Physical Impression"),
        ("digital_scan", "Digital Intraoral Scan"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent_to_lab", "Sent to Lab"),
        ("in_fabrication", "In Fabrication"),
        ("trial_ready", "Trial Ready"),
        ("trial_done", "Trial Done"),
        ("remake_requested", "Remake Requested"),
        ("delivered", "Delivered"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    ACCEPTANCE_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    # Shared valid transition dictionary defining permitted next statuses from any current status
    VALID_TRANSITIONS = {
        "draft": ["sent_to_lab"],
        "sent_to_lab": ["in_fabrication", "delivered"],
        "in_fabrication": ["trial_ready", "delivered"],
        "trial_ready": ["trial_done"],
        "trial_done": ["in_fabrication", "delivered", "remake_requested"],
        "remake_requested": ["in_fabrication", "sent_to_lab"],
        "delivered": ["accepted", "rejected", "remake_requested"],
        "accepted": [],
        "rejected": ["remake_requested"],
    }

    order_number = models.CharField(max_length=20, unique=True, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name="lab_orders")
    tooth_record = models.ForeignKey(
        ToothRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name="lab_orders"
    )
    treatment_plan_item = models.ForeignKey(
        TreatmentPlanItem, on_delete=models.SET_NULL, null=True, blank=True, related_name="lab_orders"
    )
    lab = models.ForeignKey(DentalLab, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    ordering_doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="lab_orders_placed"
    )

    work_type = models.CharField(max_length=30, choices=WORK_TYPE_CHOICES)
    tooth_numbers = models.CharField(max_length=50, blank=True)
    shade = models.CharField(max_length=30, blank=True)
    material = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    impression_type = models.CharField(max_length=15, choices=IMPRESSION_TYPE_CHOICES, default="physical")
    special_instructions = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    date_sent = models.DateField(null=True, blank=True)
    trial_date = models.DateField(null=True, blank=True)
    promised_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)

    lab_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    patient_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    warranty_months = models.PositiveSmallIntegerField(null=True, blank=True)

    remake_count = models.PositiveSmallIntegerField(default=0)
    remake_reason = models.TextField(blank=True)

    doctor_acceptance = models.CharField(max_length=10, choices=ACCEPTANCE_CHOICES, default="pending")
    acceptance_notes = models.TextField(blank=True)
    quality_photo = models.ImageField(upload_to="lab_quality_photos/", null=True, blank=True)

    courier_name = models.CharField(max_length=100, blank=True)
    courier_tracking = models.CharField(max_length=100, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-generate unique sequential order_number (LAB00001, LAB00002...)
        if not self.order_number:
            last = LabOrder.objects.order_by("id").last()
            next_id = (last.id + 1) if last else 1
            self.order_number = f"LAB{next_id:05d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_number} - {self.get_work_type_display()} ({self.patient.first_name} {self.patient.last_name})"


class LabOrderStatusLog(models.Model):
    """
    Maintains an immutable historical log of every status change made to a lab order for accountability.
    """
    lab_order = models.ForeignKey(LabOrder, on_delete=models.CASCADE, related_name="status_logs")
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    notes = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lab_order.order_number}: {self.old_status} -> {self.new_status}"
