import os
import shutil
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

# Import Models across all 13 modules
from accounts.models import User, AuditLog
from patients.models import Patient, Guardian, MedicalHistory, Allergy, FamilyLink
from duplicates.models import DuplicateFlag
from vitals.models import Vitals
from dental_chart.models import (
    ToothRecord,
    EndodonticDetail,
    ImplantDetail,
    OrthodonticDetail,
    ToothRecordHistory,
)
from perio_chart.models import PerioExam, PerioToothMeasurement, PerioSiteReading
from treatment_plans.models import TreatmentPlan, TreatmentPlanItem
from case_files.models import Case, CaseVisitNote, MaterialUsed
from case_media.models import MediaFile
from appointments.models import (
    Chair,
    DoctorSchedule,
    Appointment,
    AppointmentRescheduleLog,
    RecallReminder,
)
from lab_management.models import DentalLab, LabOrder, LabOrderStatusLog
from inventory.models import (
    ItemCategory,
    InventoryItem,
    StockBatch,
    StockTransaction,
    Equipment,
    MaintenanceLog,
)
from billing.models import (
    ClinicFinancialSettings,
    Invoice,
    InvoiceLineItem,
    DiscountApprovalRequest,
    Payment,
    PriceOverrideLog,
    PatientAccount,
)


class Command(BaseCommand):
    help = "Seeds comprehensive, interconnected sample data across all clinical and administrative modules for Dr. Chandrika Dental Care"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clears existing clinical sample data before seeding new records.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting complete clinic database seeding..."))

        if options.get("clear"):
            self.stdout.write(self.style.WARNING("Clearing existing clinical transactional data..."))
            InvoiceLineItem.objects.all().delete()
            Payment.objects.all().delete()
            DiscountApprovalRequest.objects.all().delete()
            PriceOverrideLog.objects.all().delete()
            Invoice.objects.all().delete()
            PatientAccount.objects.all().delete()
            LabOrderStatusLog.objects.all().delete()
            LabOrder.objects.all().delete()
            StockTransaction.objects.all().delete()
            StockBatch.objects.all().delete()
            InventoryItem.objects.all().delete()
            MaintenanceLog.objects.all().delete()
            Equipment.objects.all().delete()
            RecallReminder.objects.all().delete()
            AppointmentRescheduleLog.objects.all().delete()
            Appointment.objects.all().delete()
            DoctorSchedule.objects.all().delete()
            Chair.objects.all().delete()
            MediaFile.objects.all().delete()
            MaterialUsed.objects.all().delete()
            CaseVisitNote.objects.all().delete()
            Case.objects.all().delete()
            TreatmentPlanItem.objects.all().delete()
            TreatmentPlan.objects.all().delete()
            PerioSiteReading.objects.all().delete()
            PerioToothMeasurement.objects.all().delete()
            PerioExam.objects.all().delete()
            EndodonticDetail.objects.all().delete()
            ImplantDetail.objects.all().delete()
            OrthodonticDetail.objects.all().delete()
            ToothRecordHistory.objects.all().delete()
            ToothRecord.objects.all().delete()
            Vitals.objects.all().delete()
            DuplicateFlag.objects.all().delete()
            FamilyLink.objects.all().delete()
            Allergy.objects.all().delete()
            MedicalHistory.objects.all().delete()
            Guardian.objects.all().delete()
            Patient.objects.all().delete()
            AuditLog.objects.all().delete()

        # ---------------------------------------------------------
        # 1. Accounts & Role-Based Staff Users
        # ---------------------------------------------------------
        self.stdout.write("1. Seeding staff & portal accounts...")
        staff_data = [
            ("chandrika", "chandrika@chandrikadental.com", "Chandrika", "Doctor", User.Role.CHIEF_DOCTOR, "9840112233"),
            ("dr_ramesh", "ramesh@chandrikadental.com", "Ramesh", "Babu", User.Role.DOCTOR, "9840223344"),
            ("dr_priya", "priya@chandrikadental.com", "Priya", "Sharma", User.Role.DOCTOR, "9840334455"),
            ("anitha", "anitha@chandrikadental.com", "Anitha", "Reddy", User.Role.ASSISTANT, "9840445566"),
            ("kavitha", "kavitha@chandrikadental.com", "Kavitha", "Nair", User.Role.RECEPTIONIST, "9840556677"),
            ("suresh", "suresh@chandrikadental.com", "Suresh", "Kumar", User.Role.ACCOUNTANT, "9840667788"),
            ("patient_rajesh", "rajesh.k@gmail.com", "Rajesh", "Kannan", User.Role.PATIENT, "9840778899"),
        ]

        users = {}
        for username, email, first, last, role, phone in staff_data:
            user, created = User.objects.get_or_create(username=username, defaults={
                "email": email,
                "first_name": first,
                "last_name": last,
                "role": role,
                "phone": phone,
                "status": "active",
            })
            if created:
                user.set_password("password123")
                user.save()
            users[username] = user

        chief_doc = users["chandrika"]
        doc_ramesh = users["dr_ramesh"]
        doc_priya = users["dr_priya"]
        receptionist = users["kavitha"]
        assistant = users["anitha"]
        accountant = users["suresh"]
        patient_user = users["patient_rajesh"]

        # ---------------------------------------------------------
        # 2. Patients, Medical Histories, Allergies & Guardians
        # ---------------------------------------------------------
        self.stdout.write("2. Seeding patient records and medical histories...")
        patients_info: list[dict[str, Any]] = [
            {
                "key": "p1",
                "code": "PT00001",
                "first": "Rajesh",
                "last": "Kannan",
                "dob": date(1986, 5, 14),
                "gender": "male",
                "phone": "9840778899",
                "email": "rajesh.k@gmail.com",
                "address": "42, Anna Nagar West, Chennai",
                "linked_user": patient_user,
                "emergency_name": "Deepa Kannan",
                "emergency_phone": "9840778800",
                "conditions": [("Type 2 Diabetes Mellitus", "Controlled on Metformin 500mg BD")],
                "allergies": [("Penicillin", "Facial swelling and hives", "severe")],
            },
            {
                "key": "p2",
                "code": "PT00002",
                "first": "Sunita",
                "last": "Natarajan",
                "dob": date(1992, 11, 23),
                "gender": "female",
                "phone": "9876123450",
                "email": "sunita.n@gmail.com",
                "address": "12/4, T. Nagar, Chennai",
                "emergency_name": "Arun Natarajan",
                "emergency_phone": "9876123499",
                "conditions": [("Hypertension", "On Telmisartan 40mg OD")],
                "allergies": [("Lidocaine with Adrenaline", "Tachycardia and palpitations", "moderate")],
            },
            {
                "key": "p3",
                "code": "PT00003",
                "first": "Master Aarav",
                "last": "Balaji",
                "dob": date(2018, 8, 10),
                "gender": "male",
                "phone": "9789012345",
                "email": "balaji.parent@yahoo.com",
                "address": "88, Velachery Main Road, Chennai",
                "emergency_name": "Balaji Venkat",
                "emergency_phone": "9789012345",
                "guardian": ("Balaji Venkat", "Father", "9789012345", "Aadhaar Card", "XXXX-XXXX-4589"),
                "conditions": [("Asthma", "Mild intermittent, uses Budesonide inhaler SOS")],
                "allergies": [],
            },
            {
                "key": "p4",
                "code": "PT00004",
                "first": "Meenakshi",
                "last": "Sundaram",
                "dob": date(1960, 3, 19),
                "gender": "female",
                "phone": "9444123456",
                "email": "meenakshi.s@rediffmail.com",
                "address": "5, Luz Church Road, Mylapore, Chennai",
                "emergency_name": "Sundaram Swaminathan",
                "emergency_phone": "9444123499",
                "conditions": [("Osteoporosis", "Undergoing bisphosphonate therapy"), ("Cardiovascular Disease", "Stent placed in 2022")],
                "allergies": [("Latex", "Contact dermatitis", "mild")],
            },
            {
                "key": "p5",
                "code": "PT00005",
                "first": "Vikram",
                "last": "Chandran",
                "dob": date(1998, 7, 2),
                "gender": "male",
                "phone": "9123456780",
                "email": "vikram.c@outlook.com",
                "address": "104, OMR IT Corridor, Thoraipakkam, Chennai",
                "emergency_name": "Gayatri Chandran",
                "emergency_phone": "9123456789",
                "conditions": [],
                "allergies": [],
            },
        ]

        patients = {}
        for pdata in patients_info:
            p, _ = Patient.objects.get_or_create(patient_code=pdata["code"], defaults={
                "first_name": pdata["first"],
                "last_name": pdata["last"],
                "dob": pdata["dob"],
                "gender": pdata["gender"],
                "phone": pdata["phone"],
                "email": pdata["email"],
                "address": pdata["address"],
                "city": "Chennai",
                "state": "Tamil Nadu",
                "country": "India",
                "preferred_language": "Tamil",
                "emergency_contact_name": pdata.get("emergency_name", ""),
                "emergency_contact_phone": pdata.get("emergency_phone", ""),
                "linked_user": pdata.get("linked_user"),
                "registered_by": receptionist,
                "status": "active",
            })
            patients[pdata["key"]] = p

            # Guardians
            if "guardian" in pdata and pdata["guardian"]:
                g_info = pdata["guardian"]
                g_name, g_rel, g_phone, g_type, g_num = g_info[0], g_info[1], g_info[2], g_info[3], g_info[4]
                Guardian.objects.get_or_create(patient=p, name=g_name, defaults={
                    "relationship": g_rel,
                    "phone": g_phone,
                    "id_proof_type": g_type,
                    "id_proof_number": g_num,
                })

            # Medical Conditions
            conditions_list = pdata.get("conditions") or []
            for cond in conditions_list:
                c_name, c_notes = cond[0], cond[1]
                MedicalHistory.objects.get_or_create(patient=p, condition_name=c_name, defaults={
                    "notes": c_notes,
                    "diagnosed_date": date(2023, 1, 15),
                    "is_active": True,
                    "recorded_by": doc_ramesh,
                })

            # Allergies
            allergies_list = pdata.get("allergies") or []
            for allergy in allergies_list:
                a_name, a_rxn, a_sev = allergy[0], allergy[1], allergy[2]
                Allergy.objects.get_or_create(patient=p, allergen=a_name, defaults={
                    "reaction": a_rxn,
                    "severity": a_sev,
                    "recorded_by": chief_doc,
                })

        p1 = patients["p1"]
        p2 = patients["p2"]
        p3 = patients["p3"]
        p4 = patients["p4"]
        p5 = patients["p5"]

        # ---------------------------------------------------------
        # 3. Patient Duplicate Detection Queue
        # ---------------------------------------------------------
        self.stdout.write("3. Seeding duplicate detection match records...")
        p_dup, _ = Patient.objects.get_or_create(patient_code="PT00006", defaults={
            "first_name": "Rajesh",
            "last_name": "Kannan",
            "dob": date(1986, 5, 14),
            "gender": "male",
            "phone": "9840778888",  # Near-identical profile (name, DOB, address)
            "email": "rajesh_kannan_alt@gmail.com",
            "address": "42 Anna Nagar, Chennai",
            "registered_by": receptionist,
            "status": "active",
        })

        DuplicateFlag.objects.get_or_create(
            patient_a=p1,
            patient_b=p_dup,
            defaults={
                "match_score": Decimal("95.00"),
                "matched_fields": {"name_similarity": 1.0, "dob": True, "address_similarity": 1.0},
                "status": "pending",
                "flagged_by": None,  # System automated detection
            },
        )

        # ---------------------------------------------------------
        # 4. Clinical Vitals (Normal & Flagged Ranges)
        # ---------------------------------------------------------
        self.stdout.write("4. Seeding multi-context clinical vitals...")
        # Normal vitals for p1
        Vitals.objects.get_or_create(patient=p1, context="registration", defaults={
            "bp_systolic": 122,
            "bp_diastolic": 80,
            "pulse": 74,
            "blood_sugar": 135,
            "temperature": Decimal("98.4"),
            "spo2": 98,
            "weight_kg": Decimal("72.5"),
            "height_cm": Decimal("174.0"),
            "notes": "Patient resting comfortably before evaluation.",
            "recorded_by": assistant,
        })

        # Abnormal / Flagged vitals for p2 before surgical extraction
        v_flagged, _ = Vitals.objects.get_or_create(patient=p2, context="pre_treatment", defaults={
            "bp_systolic": 156,  # Flag: Systolic >= 140
            "bp_diastolic": 96,   # Flag: Diastolic >= 90
            "pulse": 104,         # Flag: Tachycardia > 100
            "blood_sugar": 195,   # Flag: Blood sugar > 180
            "temperature": Decimal("99.1"),
            "spo2": 97,
            "weight_kg": Decimal("64.0"),
            "height_cm": Decimal("160.0"),
            "notes": "Patient anxious. Advised 15 minutes calm rest before re-checking vitals.",
            "recorded_by": assistant,
        })

        # ---------------------------------------------------------
        # 5. Dental Chart / Odontogram (Adult & Primary, FDI, Sub-Forms)
        # ---------------------------------------------------------
        self.stdout.write("5. Seeding interactive dental odontogram & specialized forms...")
        # Tooth 16: Adult Upper Right First Molar - RCT Treated
        tr_16, _ = ToothRecord.objects.get_or_create(patient=p1, tooth_number="16", defaults={
            "dentition_type": "adult",
            "surface": "occlusal",
            "condition": "rct",
            "status": "completed",
            "notes": "Full endodontic therapy completed. Zirconia crown placed.",
            "recorded_by": doc_ramesh,
        })
        EndodonticDetail.objects.get_or_create(tooth_record=tr_16, defaults={
            "working_length_mm": Decimal("21.5"),
            "canal_count": 3,
            "obturation_date": date(2026, 9, 20),
            "technique_notes": "Cold lateral condensation with AH Plus Bioceramic sealer. MB, DB, Palatal canals.",
        })

        # Tooth 46: Adult Lower Right First Molar - Implant
        tr_46, _ = ToothRecord.objects.get_or_create(patient=p1, tooth_number="46", defaults={
            "dentition_type": "adult",
            "surface": "whole",
            "condition": "implant",
            "status": "completed",
            "notes": "Osseointegrated Nobel Biocare implant with custom abutment.",
            "recorded_by": chief_doc,
        })
        ImplantDetail.objects.get_or_create(tooth_record=tr_46, defaults={
            "brand": "Nobel Biocare Replace Select",
            "diameter_mm": Decimal("4.30"),
            "length_mm": Decimal("11.50"),
            "batch_number": "NB-2026-X889",
            "serial_number": "SN-98234710",
            "placement_date": date(2026, 4, 10),
            "bone_graft_material": "Bio-Oss Xenograft 0.5g",
            "warranty_months": 60,
        })

        # Tooth 21: Upper Central Incisor - Orthodontic bracket
        tr_21, _ = ToothRecord.objects.get_or_create(patient=p5, tooth_number="21", defaults={
            "dentition_type": "adult",
            "surface": "buccal",
            "condition": "decay",
            "status": "planned",
            "notes": "Class III malocclusion alignment in progress.",
            "recorded_by": doc_priya,
        })
        OrthodonticDetail.objects.get_or_create(tooth_record=tr_21, defaults={
            "appliance_type": "Fixed Ceramic Brackets (Roth 0.022)",
            "bracket_type": "3M Clarity Advanced",
            "wire_size": "0.016x0.022 NiTi",
            "position_notes": "Mild midline diastema correction.",
            "adjustment_date": date(2026, 10, 15),
        })

        # Tooth 54: Primary First Milk Molar for Pediatric Patient (p3)
        ToothRecord.objects.get_or_create(patient=p3, tooth_number="54", defaults={
            "dentition_type": "primary",
            "surface": "mesial",
            "condition": "filling",
            "status": "completed",
            "notes": "GIC Class II filling done under topical anesthesia.",
            "recorded_by": doc_ramesh,
        })

        # ---------------------------------------------------------
        # 6. Periodontal Charting & 6-Site Probing Exam
        # ---------------------------------------------------------
        self.stdout.write("6. Seeding 6-site periodontal exam records...")
        perio_exam, _ = PerioExam.objects.get_or_create(patient=p4, defaults={
            "diagnosis_summary": "Generalized Stage II Grade B Periodontitis with localized 5-6mm deep pockets.",
            "performed_by": doc_ramesh,
        })

        # Tooth 31 periodontal measurements
        pt_meas, _ = PerioToothMeasurement.objects.get_or_create(exam=perio_exam, tooth_number="31", defaults={
            "mobility_grade": 1,
            "furcation_grade": 0,
            "plaque_present": True,
            "calculus_present": True,
        })

        site_readings_data = [
            ("mesiobuccal", 4, 1, True, False),
            ("buccal", 3, 0, False, False),
            ("distobuccal", 5, 2, True, False),
            ("mesiolingual", 4, 1, False, False),
            ("lingual", 3, 0, False, False),
            ("distolingual", 5, 1, True, True),
        ]
        for site, depth, rec, bop, supp in site_readings_data:
            PerioSiteReading.objects.get_or_create(tooth_measurement=pt_meas, site=site, defaults={
                "pocket_depth_mm": depth,
                "recession_mm": rec,
                "bleeding_on_probing": bop,
                "suppuration": supp,
            })

        # ---------------------------------------------------------
        # 7. Treatment Plans, Pricing & Patient Consent
        # ---------------------------------------------------------
        self.stdout.write("7. Seeding multi-phase treatment plans & procedure items...")
        plan1, _ = TreatmentPlan.objects.get_or_create(
            patient=p1,
            title="Comprehensive Restorative & Crown Rehabilitation",
            defaults={
                "chief_complaint": "Severe sensitivity in upper right molar and replacement of missing tooth.",
                "doctor": doc_ramesh,
                "status": "accepted",
                "consent_required": True,
                "consent_signed": True,
                "consent_signed_at": timezone.now(),
                "patient_signature": "Rajesh Kannan (Digital Sign-off)",
                "revision_number": 1,
                "created_by": doc_ramesh,
            },
        )

        plan_items = [
            ("16", "RCT + Bioceramic Core", "urgent", 1, 60, Decimal("6500.00"), Decimal("1200.00"), Decimal("0.00"), Decimal("500.00"), Decimal("0.00")),
            ("16", "Zirconia Monolithic Crown", "restorative", 2, 45, Decimal("8500.00"), Decimal("500.00"), Decimal("2200.00"), Decimal("0.00"), Decimal("450.00")),
            ("36", "Full Mouth Ultrasonic Scaling & Polishing", "preventive", 1, 30, Decimal("1800.00"), Decimal("200.00"), Decimal("0.00"), Decimal("0.00"), Decimal("0.00")),
        ]

        for tooth, proc, phase, seq, dur, base, mat, lab, disc, tax in plan_items:
            TreatmentPlanItem.objects.get_or_create(plan=plan1, procedure_name=proc, defaults={
                "tooth_number": tooth,
                "phase": phase,
                "visit_sequence": seq,
                "expected_duration_minutes": dur,
                "base_price": base,
                "material_price": mat,
                "lab_charge": lab,
                "discount_amount": disc,
                "tax_amount": tax,
                "status": "completed" if seq == 1 else "in_progress",
                "completion_percentage": 100 if seq == 1 else 50,
            })

        plan1.recalculate_total()

        # ---------------------------------------------------------
        # 8. Clinical Case Files, Visit Notes & Batch Materials
        # ---------------------------------------------------------
        self.stdout.write("8. Seeding clinical case files & material traceability...")
        case1, _ = Case.objects.get_or_create(
            patient=p1,
            title="Endodontic Retreatment & Crown — Tooth 16",
            defaults={
                "category": "general",
                "status": "open",
                "opened_by": doc_ramesh,
            },
        )

        vn1, _ = CaseVisitNote.objects.get_or_create(case=case1, chief_complaint="Throbbing pain on mastication tooth 16", defaults={
            "examination_findings": "Tender to vertical percussion. Negative to cold thermal test.",
            "diagnosis": "Symptomatic Apical Periodontitis tooth 16.",
            "procedure_performed": "Access cavity prepared, pulp extirpated, canals irrigated with 3% NaOCl, working lengths verified via apex locator.",
            "outcome_notes": "Patient experienced prompt pain relief. Temporized with Cavit.",
            "next_appointment_notes": "Scheduled for canal shaping and master cone fit in 5 days.",
            "doctor": doc_ramesh,
            "assistant": assistant,
            "recorded_by": doc_ramesh,
        })

        MaterialUsed.objects.get_or_create(visit_note=vn1, material_name="3% Sodium Hypochlorite Solution", defaults={
            "batch_number": "NAOCL-2026-BATCH09",
            "quantity": Decimal("10.00"),
            "unit": "ml",
        })
        MaterialUsed.objects.get_or_create(visit_note=vn1, material_name="AH Plus Bioceramic Sealer", defaults={
            "batch_number": "DENTSPLY-AH-9912",
            "quantity": Decimal("1.00"),
            "unit": "tube",
        })

        # ---------------------------------------------------------
        # 9. Case Media & File Management
        # ---------------------------------------------------------
        self.stdout.write("9. Seeding diagnostic X-rays & clinical case media...")
        # Ensure sample file exists in media directory
        target_dir = os.path.join(settings.MEDIA_ROOT, "patient_media", "2026", "10")
        os.makedirs(target_dir, exist_ok=True)
        source_sample = os.path.join(settings.MEDIA_ROOT, "patient_media", "2026", "08", "sample_xray.jpg")
        sample_dest = os.path.join(target_dir, "iopa_tooth_16.jpg")

        if os.path.exists(source_sample) and not os.path.exists(sample_dest):
            shutil.copyfile(source_sample, sample_dest)

        MediaFile.objects.get_or_create(patient=p1, caption="Pre-op IOPA X-Ray Tooth 16", defaults={
            "case": case1,
            "tooth_number": "16",
            "media_type": "xray",
            "category": "iopa",
            "file": "patient_media/2026/08/sample_xray.jpg" if os.path.exists(source_sample) else "patient_media/sample.jpg",
            "version_number": 1,
            "is_current": True,
            "uploaded_by": doc_ramesh,
        })

        # ---------------------------------------------------------
        # 10. Appointments, Working Schedules & Walk-Ins
        # ---------------------------------------------------------
        self.stdout.write("10. Seeding clinic chairs, doctor schedules, and appointments...")
        chair1, _ = Chair.objects.get_or_create(name="Operatory Chair 1 (Main Operatory)", defaults={"location": "First Floor East Wing", "is_active": True})
        chair2, _ = Chair.objects.get_or_create(name="Operatory Chair 2 (Pediatric Suite)", defaults={"location": "First Floor West Wing", "is_active": True})

        # Doctor Schedules (Monday to Saturday)
        for day in range(6):
            DoctorSchedule.objects.get_or_create(
                doctor=doc_ramesh,
                day_of_week=day,
                start_time=time(9, 0),
                defaults={
                    "end_time": time(13, 0),
                    "slot_duration_minutes": 30,
                    "default_chair": chair1,
                },
            )

        today = date.today()
        # Confirmed appointment today
        appt1, _ = Appointment.objects.get_or_create(
            patient=p1,
            doctor=doc_ramesh,
            appointment_date=today,
            start_time=time(9, 30),
            defaults={
                "end_time": time(10, 0),
                "chair": chair1,
                "status": "confirmed",
                "source": "receptionist",
                "reason_for_visit": "Crown cementation and bite verification",
                "token_number": 1,
                "created_by": receptionist,
            },
        )

        # Walk-in appointment today
        Appointment.objects.get_or_create(
            patient=p2,
            doctor=doc_ramesh,
            appointment_date=today,
            start_time=time(10, 30),
            defaults={
                "end_time": time(11, 0),
                "chair": chair1,
                "status": "checked_in",
                "source": "walk_in",
                "reason_for_visit": "Sudden severe toothache (Emergency walk-in)",
                "token_number": 2,
                "created_by": receptionist,
            },
        )

        # Public Website pending appointment request
        Appointment.objects.get_or_create(
            appointment_date=today + timedelta(days=2),
            start_time=time(11, 30),
            source="public_request",
            defaults={
                "end_time": time(12, 0),
                "guest_name": "Arvind Swamy",
                "guest_phone": "9841098410",
                "guest_email": "arvind.swamy@gmail.com",
                "status": "pending",
                "reason_for_visit": "Inquiring about dental implants and full mouth teeth replacement",
            },
        )

        # Recall reminder for preventive cleaning
        RecallReminder.objects.get_or_create(patient=p1, recall_type="cleaning", defaults={
            "recall_date": today + timedelta(days=60),
            "status": "scheduled",
            "notes": "Routine 6-month supragingival scaling and enamel fluoride treatment.",
            "created_by": doc_ramesh,
        })

        # ---------------------------------------------------------
        # 11. Laboratory Management (Labs & Fabricated Prosthetics)
        # ---------------------------------------------------------
        self.stdout.write("11. Seeding dental laboratories & prosthetic orders...")
        lab1, _ = DentalLab.objects.get_or_create(name="Apex Dental Ceramics & CAD-CAM Lab", defaults={
            "contact_person": "Mahesh Sharma",
            "phone": "9840199881",
            "email": "orders@apexceramiclab.com",
            "address": "28, Industrial Estate, Guindy, Chennai",
            "is_active": True,
        })

        LabOrder.objects.get_or_create(
            order_number="LAB00001",
            defaults={
                "patient": p1,
                "lab": lab1,
                "ordering_doctor": doc_ramesh,
                "work_type": "crown",
                "tooth_numbers": "16",
                "shade": "A2 (Vita Classical)",
                "material": "Zirconia Multi-Layered Monolithic",
                "brand": "Katana Kuraray",
                "impression_type": "digital_scan",
                "special_instructions": "Ensure tight distal contact point and anatomical occlusal fissures.",
                "status": "in_fabrication",
                "date_sent": today - timedelta(days=3),
                "promised_delivery_date": today + timedelta(days=2),
                "lab_cost": Decimal("1800.00"),
                "patient_charge": Decimal("8500.00"),
                "warranty_months": 60,
                "courier_name": "BlueDart Express",
                "courier_tracking": "BD-CH-9923841",
                "created_by": doc_ramesh,
            },
        )

        # ---------------------------------------------------------
        # 12. Inventory, Consumable Supplies & Equipment Assets
        # ---------------------------------------------------------
        self.stdout.write("12. Seeding inventory stocks, batches, and clinic equipment...")
        cat_anes, _ = ItemCategory.objects.get_or_create(name="Local Anesthetics & Needles")
        cat_comp, _ = ItemCategory.objects.get_or_create(name="Restorative Composites & Cements")
        cat_ppe, _ = ItemCategory.objects.get_or_create(name="Infection Control & PPE")

        # Item 1: Lignocaine (Healthy stock)
        item_ligno, _ = InventoryItem.objects.get_or_create(item_code="INV00001", defaults={
            "name": "Lignocaine 2% with Adrenaline 1:80000 Cartridges",
            "category": cat_anes,
            "brand": "Septodont Lignospan Special",
            "unit_of_measure": "box of 50",
            "current_stock": Decimal("18.00"),
            "minimum_stock_level": Decimal("5.00"),
            "reorder_quantity": Decimal("10.00"),
            "unit_cost": Decimal("1250.00"),
            "selling_price": Decimal("1600.00"),
            "storage_location": "Surgical Drug Locker Shelf A",
        })

        StockBatch.objects.get_or_create(item=item_ligno, batch_number="LSP-2026-B81", defaults={
            "quantity_received": Decimal("20.00"),
            "quantity_remaining": Decimal("18.00"),
            "expiry_date": today + timedelta(days=365),
            "supplier_name": "MedPlus Dental Distributors",
            "supplier_invoice": "INV-MP-8831",
            "purchase_cost": Decimal("25000.00"),
            "received_by": assistant,
        })

        # Item 2: Nitrile Gloves (Low Stock alert trigger)
        item_gloves, _ = InventoryItem.objects.get_or_create(item_code="INV00002", defaults={
            "name": "Nitrile Powder-Free Examination Gloves (Size M)",
            "category": cat_ppe,
            "brand": "Kranz Medical",
            "unit_of_measure": "box of 100",
            "current_stock": Decimal("3.00"),   # Low Stock! (min level 10)
            "minimum_stock_level": Decimal("10.00"),
            "reorder_quantity": Decimal("25.00"),
            "unit_cost": Decimal("380.00"),
            "selling_price": Decimal("450.00"),
            "storage_location": "Sterilization Central Bay",
        })

        # Item 3: Universal Composite (Batch Expiring Soon alert trigger)
        item_comp, _ = InventoryItem.objects.get_or_create(item_code="INV00003", defaults={
            "name": "3M Filtek Z250 Microhybrid Composite Syringe (Shade A2)",
            "category": cat_comp,
            "brand": "3M ESPE Dental",
            "unit_of_measure": "syringe 4g",
            "current_stock": Decimal("6.00"),
            "minimum_stock_level": Decimal("2.00"),
            "reorder_quantity": Decimal("5.00"),
            "unit_cost": Decimal("1450.00"),
            "selling_price": Decimal("2200.00"),
            "storage_location": "Operatory Cabinet Drawer 3",
        })

        StockBatch.objects.get_or_create(item=item_comp, batch_number="3M-Z250-EXPIRING", defaults={
            "quantity_received": Decimal("5.00"),
            "quantity_remaining": Decimal("2.00"),
            "expiry_date": today + timedelta(days=12),  # Expiring in 12 days! Triggers yellow alert banner
            "supplier_name": "Dentmart Supplies Pvt Ltd",
            "supplier_invoice": "DM-2026-441",
            "purchase_cost": Decimal("7250.00"),
            "received_by": assistant,
        })

        # Equipment Asset
        equip_autoclave, _ = Equipment.objects.get_or_create(equipment_code="EQP00001", defaults={
            "name": "Class B Vacuum Autoclave Sterilizer 23L",
            "model_number": "Runyes SEA-23L-B-LED",
            "serial_number": "RY-AUTOCLAVE-99214",
            "manufacturer": "Runyes Medical Instruments",
            "location": "Sterilization Room A",
            "purchase_date": date(2023, 6, 1),
            "warranty_expiry": date(2026, 6, 1),
            "status": "active",
        })

        MaintenanceLog.objects.get_or_create(equipment=equip_autoclave, description="Bi-annual pressure valve calibration and door gasket replacement", defaults={
            "maintenance_type": "calibration",
            "performed_by_staff": assistant,
            "external_technician": "S. Murugan (Certified Medical Equipment Engineer)",
            "service_date": today - timedelta(days=20),
            "next_due_date": today + timedelta(days=160),
            "cost": Decimal("3500.00"),
            "notes": "Passed biological spore indicator test with zero spore growth.",
        })

        # ---------------------------------------------------------
        # 13. Billing & Financial Governance (Invoices, Approvals, Payments)
        # ---------------------------------------------------------
        self.stdout.write("13. Seeding financial governance, invoices, payments & approval requests...")
        fin_settings = ClinicFinancialSettings.get_settings()
        fin_settings.discount_approval_threshold_percent = Decimal("10.00")
        fin_settings.discount_approval_threshold_amount = Decimal("2000.00")
        fin_settings.default_tax_percent = Decimal("0.00")
        fin_settings.save()

        # Patient 1 Account (Prepaid advance balance)
        p1_acc, _ = PatientAccount.objects.get_or_create(patient=p1, defaults={"credit_balance": Decimal("2000.00")})

        # Invoice 1: Issued & Partially Paid
        inv1, _ = Invoice.objects.get_or_create(
            invoice_number="INV00001",
            defaults={
                "patient": p1,
                "treatment_plan": plan1,
                "status": "partially_paid",
                "issue_date": today - timedelta(days=5),
                "due_date": today + timedelta(days=10),
                "notes": "Payment plan: 50% paid on preparation visit, remainder due upon final crown placement.",
                "created_by": receptionist,
            },
        )

        InvoiceLineItem.objects.get_or_create(invoice=inv1, description="Root Canal Treatment (Molar Multi-Canal)", defaults={
            "tooth_number": "16",
            "quantity": Decimal("1.00"),
            "unit_price": Decimal("6500.00"),
            "internal_unit_cost": Decimal("1400.00"),
            "discount_amount": Decimal("500.00"),
            "discount_approved": True,
            "tax_amount": Decimal("0.00"),
            "notes": "Approved concession for senior patient.",
        })

        InvoiceLineItem.objects.get_or_create(invoice=inv1, description="Zirconia Monolithic Crown (A2)", defaults={
            "tooth_number": "16",
            "quantity": Decimal("1.00"),
            "unit_price": Decimal("8500.00"),
            "internal_unit_cost": Decimal("2200.00"),
            "discount_amount": Decimal("0.00"),
            "discount_approved": True,
            "tax_amount": Decimal("0.00"),
        })

        # Recalculate totals
        inv1.recalculate_totals()
        inv1.amount_paid = Decimal("7000.00")
        inv1.balance_due = Decimal("7500.00")
        inv1.status = "partially_paid"
        inv1.save()

        # Payment for Invoice 1
        Payment.objects.get_or_create(payment_number="PAY00001", defaults={
            "invoice": inv1,
            "patient": p1,
            "payment_type": "payment",
            "amount": Decimal("7000.00"),
            "payment_method": "upi",
            "reference_number": "UPI-GPay-9823487192",
            "payment_date": today - timedelta(days=5),
            "notes": "50% advance deposit paid at front desk.",
            "recorded_by": receptionist,
        })

        # Invoice 2: With Over-Threshold Discount Pending Chief Doctor Approval!
        inv2, _ = Invoice.objects.get_or_create(
            invoice_number="INV00002",
            defaults={
                "patient": p2,
                "status": "draft",
                "notes": "Awaiting Chief Doctor sign-off on special implant discount.",
                "created_by": doc_ramesh,
            },
        )

        li2, _ = InvoiceLineItem.objects.get_or_create(invoice=inv2, description="Surgical Nobel Biocare Implant Placement", defaults={
            "tooth_number": "46",
            "quantity": Decimal("1.00"),
            "unit_price": Decimal("35000.00"),
            "internal_unit_cost": Decimal("12000.00"),
            "discount_amount": Decimal("6000.00"),  # Exceeds 10% & ₹2000! Requires Chief Doctor sign-off
            "discount_approved": False,
            "tax_amount": Decimal("0.00"),
            "notes": "Discount requested by Dr. Ramesh: Patient referred 3 family members.",
        })

        # Pending Approval Request
        DiscountApprovalRequest.objects.get_or_create(invoice=inv2, line_item=li2, defaults={
            "requested_discount_amount": Decimal("6000.00"),
            "discount_percent": Decimal("17.14"),
            "reason": "Family loyalty referral concession for full implant surgery.",
            "status": "pending",
            "requested_by": doc_ramesh,
        })

        inv2.recalculate_totals()

        # Price Override Log
        PriceOverrideLog.objects.get_or_create(line_item=li2, new_price=Decimal("35000.00"), defaults={
            "old_price": Decimal("40000.00"),
            "reason": "Competitive match for dental implant surgical package.",
            "changed_by": doc_ramesh,
        })

        # ---------------------------------------------------------
        # 14. AuditLog History
        # ---------------------------------------------------------
        self.stdout.write("14. Writing system-wide compliance audit trails...")
        AuditLog.objects.get_or_create(action="create", module="invoice", record_id=str(inv1.id), defaults={
            "user": receptionist,
            "old_value": None,
            "new_value": {"invoice_number": inv1.invoice_number, "grand_total": str(inv1.grand_total)},
        })
        AuditLog.objects.get_or_create(action="create", module="payment", record_id="PAY00001", defaults={
            "user": receptionist,
            "old_value": None,
            "new_value": {"amount": "7000.00", "method": "upi", "reference": "UPI-GPay-9823487192"},
        })

        self.stdout.write(self.style.SUCCESS("[SUCCESS] Clinic database successfully seeded across all 13 modules!"))
        self.stdout.write(self.style.SUCCESS("Test Accounts Ready:"))
        self.stdout.write("  - Chief Doctor: username 'chandrika' / password 'password123'")
        self.stdout.write("  - Doctor:       username 'dr_ramesh' / password 'password123'")
        self.stdout.write("  - Receptionist: username 'kavitha'   / password 'password123'")
        self.stdout.write("  - Accountant:   username 'suresh'    / password 'password123'")
        self.stdout.write("  - Patient:      username 'patient_rajesh' / password 'password123'")
