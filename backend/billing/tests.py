from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import AuditLog
from patients.models import Patient
from treatment_plans.models import TreatmentPlan, TreatmentPlanItem
from .models import (
    ClinicFinancialSettings,
    Invoice,
    InvoiceLineItem,
    DiscountApprovalRequest,
    Payment,
    PriceOverrideLog,
    PatientAccount,
)

User = get_user_model()


class BillingGovernanceTests(APITestCase):
    def setUp(self):
        # 1. Create Staff & Patient Users
        self.chief_doctor = User.objects.create_user(
            username="chiefdoc",
            password="password123",
            role=User.Role.CHIEF_DOCTOR,
            first_name="Chandrika",
            last_name="Doctor",
        )
        self.doctor = User.objects.create_user(
            username="doctor1",
            password="password123",
            role=User.Role.DOCTOR,
            first_name="Ramesh",
            last_name="Babu",
        )
        self.receptionist = User.objects.create_user(
            username="receptionist1",
            password="password123",
            role=User.Role.RECEPTIONIST,
            first_name="Anitha",
            last_name="Reddy",
        )
        self.accountant = User.objects.create_user(
            username="accountant1",
            password="password123",
            role=User.Role.ACCOUNTANT,
            first_name="Suresh",
            last_name="Kumar",
        )
        self.patient_user = User.objects.create_user(
            username="patientuser",
            password="password123",
            role=User.Role.PATIENT,
            first_name="Karthik",
            last_name="Rajan",
        )
        self.other_patient_user = User.objects.create_user(
            username="otherpatient",
            password="password123",
            role=User.Role.PATIENT,
            first_name="Priya",
            last_name="Menon",
        )

        # 2. Create Patients
        self.patient = Patient.objects.create(
            patient_code="PT00001",
            first_name="Karthik",
            last_name="Rajan",
            phone="9876543210",
            linked_user=self.patient_user,
        )
        self.other_patient = Patient.objects.create(
            patient_code="PT00002",
            first_name="Priya",
            last_name="Menon",
            phone="9876543211",
            linked_user=self.other_patient_user,
        )

        # 3. Treatment Plan with item
        self.treatment_plan = TreatmentPlan.objects.create(
            patient=self.patient,
            title="Root Canal & Crown Plan",
            doctor=self.doctor,
            status=TreatmentPlan.Status.ACCEPTED,
        )
        self.plan_item = TreatmentPlanItem.objects.create(
            plan=self.treatment_plan,
            tooth_number="16",
            procedure_name="RCT + Zirconia Crown",
            base_price=Decimal("8000.00"),
            material_price=Decimal("1500.00"),
            lab_charge=Decimal("2000.00"),
            discount_amount=Decimal("0.00"),
            tax_amount=Decimal("500.00"),
        )
        self.treatment_plan.recalculate_total()

        # 4. Settings default
        self.settings = ClinicFinancialSettings.get_settings()
        self.settings.discount_approval_threshold_percent = Decimal("10.00")
        self.settings.discount_approval_threshold_amount = Decimal("2000.00")
        self.settings.default_tax_percent = Decimal("0.00")
        self.settings.save()

    def test_01_view_and_update_settings(self):
        # GET settings as chief_doctor
        self.client.force_authenticate(user=self.chief_doctor)
        res = self.client.get("/api/billing/settings/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(float(res.data["discount_approval_threshold_percent"]), 10.0)

        # PATCH settings as chief_doctor
        patch_res = self.client.patch("/api/billing/settings/", {
            "discount_approval_threshold_percent": 15,
            "default_tax_percent": 18,
        })
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(float(patch_res.data["discount_approval_threshold_percent"]), 15.0)

        # Receptionist cannot update settings
        self.client.force_authenticate(user=self.receptionist)
        res_forbidden = self.client.patch("/api/billing/settings/", {"discount_approval_threshold_percent": 20})
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

    def test_02_create_invoice_from_treatment_plan(self):
        self.client.force_authenticate(user=self.receptionist)
        res = self.client.post(f"/api/billing/{self.patient.id}/", {
            "treatment_plan": self.treatment_plan.id,
            "due_date": "2026-11-15",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["status"], "draft")
        self.assertEqual(len(res.data["line_items"]), 1)

        # unit_price = 8000 + 1500 + 2000 = 11500, tax = 500 -> grand_total = 12000
        self.assertEqual(float(res.data["grand_total"]), 12000.0)
        self.assertEqual(float(res.data["balance_due"]), 12000.0)
        self.assertTrue(AuditLog.objects.filter(module="invoice").exists())

    def test_03_role_based_internal_cost_hiding(self):
        # Create an invoice
        invoice = Invoice.objects.create(patient=self.patient, created_by=self.doctor)
        line_item = InvoiceLineItem.objects.create(
            invoice=invoice,
            description="Scaling & Polishing",
            quantity=Decimal("1.00"),
            unit_price=Decimal("1500.00"),
            internal_unit_cost=Decimal("400.00"),
            discount_amount=Decimal("0.00"),
            discount_approved=True,
            tax_amount=Decimal("0.00"),
        )
        invoice.recalculate_totals()

        # As Patient - internal cost fields MUST NOT appear
        self.client.force_authenticate(user=self.patient_user)
        res_patient = self.client.get(f"/api/billing/invoice/{invoice.id}/")
        self.assertEqual(res_patient.status_code, status.HTTP_200_OK)
        self.assertNotIn("internal_cost_total", res_patient.data)
        self.assertNotIn("internal_unit_cost", res_patient.data["line_items"][0])
        self.assertNotIn("line_internal_cost", res_patient.data["line_items"][0])

        # As Receptionist - internal cost fields MUST NOT appear
        self.client.force_authenticate(user=self.receptionist)
        res_rec = self.client.get(f"/api/billing/invoice/{invoice.id}/")
        self.assertEqual(res_rec.status_code, status.HTTP_200_OK)
        self.assertNotIn("internal_cost_total", res_rec.data)
        self.assertNotIn("internal_unit_cost", res_rec.data["line_items"][0])

        # As Chief Doctor - internal cost fields MUST appear
        self.client.force_authenticate(user=self.chief_doctor)
        res_chief = self.client.get(f"/api/billing/invoice/{invoice.id}/")
        self.assertEqual(res_chief.status_code, status.HTTP_200_OK)
        self.assertIn("internal_cost_total", res_chief.data)
        self.assertEqual(float(res_chief.data["internal_cost_total"]), 400.0)
        self.assertIn("internal_unit_cost", res_chief.data["line_items"][0])
        self.assertIn("line_internal_cost", res_chief.data["line_items"][0])

        # As Accountant - internal cost fields MUST appear
        self.client.force_authenticate(user=self.accountant)
        res_acc = self.client.get(f"/api/billing/invoice/{invoice.id}/")
        self.assertEqual(res_acc.status_code, status.HTTP_200_OK)
        self.assertIn("internal_cost_total", res_acc.data)

    def test_04_discount_governance_threshold_and_approval(self):
        invoice = Invoice.objects.create(patient=self.patient, created_by=self.doctor)

        # Line item with small discount within threshold (500 unit_price, 30 discount = 6% <= 10%)
        self.client.force_authenticate(user=self.doctor)
        res1 = self.client.post(f"/api/billing/invoice/{invoice.id}/line-items/", {
            "description": "Consultation",
            "unit_price": 500,
            "internal_unit_cost": 0,
            "discount_amount": 30,
        })
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res1.data["discount_approved"])

        invoice.refresh_from_db()
        # Grand total should reflect the 30 discount: 500 - 30 = 470
        self.assertEqual(float(invoice.grand_total), 470.0)

        # Line item with large discount (12000 unit_price, 3000 discount = 25% > 10%)
        res2 = self.client.post(f"/api/billing/invoice/{invoice.id}/line-items/", {
            "description": "Crown",
            "unit_price": 12000,
            "internal_unit_cost": 3500,
            "discount_amount": 3000,
        })
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res2.data["discount_approved"])

        # Pending discount request should exist
        req = DiscountApprovalRequest.objects.filter(invoice=invoice, status="pending").first()
        self.assertIsNotNone(req)
        self.assertEqual(float(req.requested_discount_amount), 3000.0)

        invoice.refresh_from_db()
        # Unapproved discount of 3000 MUST NOT yet reduce grand total: 470 + 12000 = 12470
        self.assertEqual(float(invoice.grand_total), 12470.0)

        # Receptionist attempts to approve -> 403 Forbidden
        self.client.force_authenticate(user=self.receptionist)
        res_unauth = self.client.post(f"/api/billing/discount-requests/{req.id}/action/", {
            "decision": "approve"
        })
        self.assertEqual(res_unauth.status_code, status.HTTP_403_FORBIDDEN)

        # Chief Doctor approves discount
        self.client.force_authenticate(user=self.chief_doctor)
        res_approve = self.client.post(f"/api/billing/discount-requests/{req.id}/action/", {
            "decision": "approve",
            "review_notes": "Loyal patient, approved",
        })
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)
        self.assertEqual(res_approve.data["status"], "approved")

        # Now discount applies: 12470 - 3000 = 9470
        invoice.refresh_from_db()
        self.assertEqual(float(invoice.grand_total), 9470.0)

    def test_05_issue_invoice_and_record_payment(self):
        invoice = Invoice.objects.create(patient=self.patient, created_by=self.doctor)
        InvoiceLineItem.objects.create(
            invoice=invoice,
            description="Filling",
            quantity=Decimal("1.00"),
            unit_price=Decimal("10000.00"),
        )
        invoice.recalculate_totals()
        self.assertEqual(invoice.status, "draft")

        # Issue invoice
        self.client.force_authenticate(user=self.receptionist)
        res_issue = self.client.post(f"/api/billing/invoice/{invoice.id}/issue/", {})
        self.assertEqual(res_issue.status_code, status.HTTP_200_OK)
        self.assertEqual(res_issue.data["status"], "issued")
        self.assertTrue(AuditLog.objects.filter(module="invoice", action="issue").exists())

        # Record partial payment of 5000 via UPI
        res_pay = self.client.post(f"/api/billing/invoice/{invoice.id}/record-payment/", {
            "amount": 5000,
            "payment_method": "upi",
            "reference_number": "UPI12345",
        })
        self.assertEqual(res_pay.status_code, status.HTTP_201_CREATED)

        invoice.refresh_from_db()
        self.assertEqual(invoice.status, "partially_paid")
        self.assertEqual(float(invoice.amount_paid), 5000.0)
        self.assertEqual(float(invoice.balance_due), 5000.0)
        self.assertTrue(AuditLog.objects.filter(module="payment").exists())

    def test_06_price_override_and_advance_and_revenue_report(self):
        # Price override by Doctor
        invoice = Invoice.objects.create(patient=self.patient, created_by=self.doctor)
        item = InvoiceLineItem.objects.create(
            invoice=invoice,
            description="X-Ray",
            quantity=Decimal("1.00"),
            unit_price=Decimal("500.00"),
        )
        invoice.recalculate_totals()

        self.client.force_authenticate(user=self.doctor)
        res_override = self.client.post(f"/api/billing/line-item/{item.id}/override-price/", {
            "new_price": 450,
            "reason": "Matched competitor quote",
        })
        self.assertEqual(res_override.status_code, status.HTTP_200_OK)
        self.assertEqual(float(res_override.data["unit_price"]), 450.0)
        self.assertTrue(PriceOverrideLog.objects.filter(line_item=item, new_price=450).exists())

        # Advance prepayment (no invoice)
        self.client.force_authenticate(user=self.receptionist)
        res_adv = self.client.post("/api/billing/payment/advance/", {
            "patient": self.patient.id,
            "amount": 2000,
            "payment_method": "cash",
            "payment_type": "advance",
        })
        self.assertEqual(res_adv.status_code, status.HTTP_201_CREATED)
        acc = PatientAccount.objects.get(patient=self.patient)
        self.assertEqual(float(acc.credit_balance), 2000.0)

        # Revenue report as Accountant
        self.client.force_authenticate(user=self.accountant)
        res_rev = self.client.get("/api/billing/reports/revenue/")
        self.assertEqual(res_rev.status_code, status.HTTP_200_OK)
        self.assertIn("gross_margin", res_rev.data)

        # Revenue report as Receptionist -> 403 Forbidden
        self.client.force_authenticate(user=self.receptionist)
        res_rev_unauth = self.client.get("/api/billing/reports/revenue/")
        self.assertEqual(res_rev_unauth.status_code, status.HTTP_403_FORBIDDEN)

        # Verify audit logs were created
        self.assertTrue(AuditLog.objects.filter(module="price_override").exists())
        self.assertTrue(AuditLog.objects.filter(module="payment").exists())
