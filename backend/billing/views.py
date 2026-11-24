from decimal import Decimal
from django.db import models, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AuditLog
from patients.models import Patient
from treatment_plans.models import TreatmentPlan
from .models import (
    ClinicFinancialSettings,
    Invoice,
    InvoiceLineItem,
    DiscountApprovalRequest,
    Payment,
    PriceOverrideLog,
    PatientAccount,
)
from .permissions import (
    InvoicePermission,
    PaymentPermission,
    DiscountApprovalPermission,
    InternalCostPermission,
    VoidPermission,
    PriceOverridePermission,
    ClinicSettingsPermission,
    CAN_VIEW_INTERNAL_COST,
)
from .serializers import (
    ClinicFinancialSettingsSerializer,
    InvoiceLineItemSerializer,
    InvoiceListSerializer,
    InvoiceDetailSerializer,
    PaymentSerializer,
    DiscountApprovalRequestSerializer,
    PriceOverrideLogSerializer,
    RecordPaymentSerializer,
    DiscountRequestActionSerializer,
    PriceOverrideSerializer,
    VoidSerializer,
)


class ClinicFinancialSettingsView(generics.RetrieveUpdateAPIView):
    """
    Get or update clinic financial governance thresholds.
    Chief Doctor only for updates; staff can read.
    """
    serializer_class = ClinicFinancialSettingsSerializer
    permission_classes = [ClinicSettingsPermission]

    def get_object(self):
        return ClinicFinancialSettings.get_settings()

    def perform_update(self, serializer):
        old_data = ClinicFinancialSettingsSerializer(self.get_object()).data
        instance = serializer.save()
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="update",
            module="billing_settings",
            record_id=str(instance.id),
            old_value=old_data,
            new_value=serializer.data,
        )


class InvoiceListCreateView(generics.ListCreateAPIView):
    """
    List invoices for a patient (with optional status filter) or create a new invoice.
    URL: /api/billing/<int:patient_id>/
    """
    permission_classes = [InvoicePermission]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return InvoiceDetailSerializer
        return InvoiceListSerializer

    def get_queryset(self):
        patient_id = self.kwargs.get("patient_id")
        patient = get_object_or_404(Patient, pk=patient_id)

        user = self.request.user
        if getattr(user, "role", None) == "patient":
            if patient.linked_user_id != user.id:
                return Invoice.objects.none()

        queryset = Invoice.objects.filter(patient=patient).order_by("-created_at")
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def create(self, request, *args, **kwargs):
        patient_id = self.kwargs.get("patient_id")
        patient = get_object_or_404(Patient, pk=patient_id)

        treatment_plan_id = request.data.get("treatment_plan")
        treatment_plan = None
        if treatment_plan_id:
            treatment_plan = get_object_or_404(TreatmentPlan, pk=treatment_plan_id)
            if treatment_plan.patient_id != patient.id:
                return Response(
                    {"treatment_plan": "Treatment plan belongs to a different patient."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        due_date = request.data.get("due_date") or None
        notes = request.data.get("notes", "")

        with transaction.atomic():
            invoice = Invoice.objects.create(
                patient=patient,
                treatment_plan=treatment_plan,
                due_date=due_date,
                notes=notes,
                created_by=request.user,
            )

            # Auto-generate line items from treatment plan if specified
            if treatment_plan:
                settings_cfg = ClinicFinancialSettings.get_settings()
                for item in treatment_plan.items.all():
                    qty = Decimal("1.00")
                    unit_price = item.base_price + item.material_price + item.lab_charge
                    internal_unit_cost = item.material_price + item.lab_charge
                    discount_amount = item.discount_amount
                    tax_amount = item.tax_amount

                    discount_approved = True
                    needs_approval = False
                    pct = Decimal("0.00")

                    if discount_amount > Decimal("0.00"):
                        base_line = unit_price * qty
                        pct = (discount_amount / base_line * Decimal("100.00")) if base_line > Decimal("0.00") else Decimal("0.00")
                        if (
                            pct > settings_cfg.discount_approval_threshold_percent
                            or discount_amount > settings_cfg.discount_approval_threshold_amount
                        ):
                            needs_approval = True
                            discount_approved = False

                    line_item = InvoiceLineItem.objects.create(
                        invoice=invoice,
                        treatment_plan_item=item,
                        description=item.procedure_name,
                        tooth_number=item.tooth_number or "",
                        quantity=qty,
                        unit_price=unit_price,
                        internal_unit_cost=internal_unit_cost,
                        discount_amount=discount_amount,
                        discount_approved=discount_approved,
                        tax_amount=tax_amount,
                        notes=item.notes or "",
                    )

                    if needs_approval:
                        req = DiscountApprovalRequest.objects.create(
                            invoice=invoice,
                            line_item=line_item,
                            requested_discount_amount=discount_amount,
                            discount_percent=round(pct, 2),
                            reason="Treatment plan discount exceeds governance threshold",
                            status=DiscountApprovalRequest.Status.PENDING,
                            requested_by=request.user,
                        )
                        AuditLog.objects.create(
                            user=request.user,
                            action="create",
                            module="discount_approval",
                            record_id=str(req.id),
                            old_value=None,
                            new_value={
                                "invoice_id": invoice.id,
                                "line_item_id": line_item.id,
                                "discount_amount": str(discount_amount),
                                "percent": str(pct),
                            },
                        )

            invoice.recalculate_totals()

            AuditLog.objects.create(
                user=request.user,
                action="create",
                module="invoice",
                record_id=str(invoice.id),
                old_value=None,
                new_value={
                    "invoice_number": invoice.invoice_number,
                    "patient_id": patient.id,
                    "treatment_plan_id": treatment_plan.id if treatment_plan else None,
                    "grand_total": str(invoice.grand_total),
                },
            )

        serializer = InvoiceDetailSerializer(invoice, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InvoiceDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update invoice-level fields (notes, due_date).
    URL: /api/billing/invoice/<int:pk>/
    """
    queryset = Invoice.objects.all()
    serializer_class = InvoiceDetailSerializer
    permission_classes = [InvoicePermission]

    def perform_update(self, serializer):
        invoice = self.get_object()
        old_data = InvoiceDetailSerializer(invoice, context={"request": self.request}).data
        with transaction.atomic():
            instance = serializer.save()
            instance.recalculate_totals()
            new_data = InvoiceDetailSerializer(instance, context={"request": self.request}).data
            AuditLog.objects.create(
                user=self.request.user,
                action="update",
                module="invoice",
                record_id=str(instance.id),
                old_value=old_data,
                new_value=new_data,
            )


class InvoiceLineItemCreateView(APIView):
    """
    Add a line item to an existing invoice.
    Enforces discount governance thresholds.
    URL: /api/billing/invoice/<int:invoice_id>/line-items/
    """
    permission_classes = [InvoicePermission]

    def post(self, request, invoice_id):
        invoice = get_object_or_404(Invoice, pk=invoice_id)
        if invoice.status == Invoice.Status.VOID:
            return Response(
                {"error": "Cannot add line items to a voided invoice."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        desc = request.data.get("description")
        if not desc:
            return Response({"description": "Description is required."}, status=status.HTTP_400_BAD_REQUEST)

        qty = Decimal(str(request.data.get("quantity", 1)))
        unit_price = Decimal(str(request.data.get("unit_price", 0)))
        internal_unit_cost = Decimal(str(request.data.get("internal_unit_cost", 0)))
        discount_amount = Decimal(str(request.data.get("discount_amount", 0)))
        tax_amount = Decimal(str(request.data.get("tax_amount", 0)))
        tooth_number = request.data.get("tooth_number", "")
        notes = request.data.get("notes", "")

        settings_cfg = ClinicFinancialSettings.get_settings()
        base_line = unit_price * qty
        pct = (discount_amount / base_line * Decimal("100.00")) if base_line > Decimal("0.00") else Decimal("0.00")

        discount_approved = True
        needs_approval = False
        if discount_amount > Decimal("0.00"):
            if (
                pct > settings_cfg.discount_approval_threshold_percent
                or discount_amount > settings_cfg.discount_approval_threshold_amount
            ):
                needs_approval = True
                discount_approved = False

        with transaction.atomic():
            line_item = InvoiceLineItem.objects.create(
                invoice=invoice,
                description=desc,
                tooth_number=tooth_number,
                quantity=qty,
                unit_price=unit_price,
                internal_unit_cost=internal_unit_cost,
                discount_amount=discount_amount,
                discount_approved=discount_approved,
                tax_amount=tax_amount,
                notes=notes,
            )

            if needs_approval:
                req = DiscountApprovalRequest.objects.create(
                    invoice=invoice,
                    line_item=line_item,
                    requested_discount_amount=discount_amount,
                    discount_percent=round(pct, 2),
                    reason=request.data.get("reason", notes or "Discount exceeds governance threshold"),
                    status=DiscountApprovalRequest.Status.PENDING,
                    requested_by=request.user,
                )
                AuditLog.objects.create(
                    user=request.user,
                    action="create",
                    module="discount_approval",
                    record_id=str(req.id),
                    old_value=None,
                    new_value={
                        "invoice_id": invoice.id,
                        "line_item_id": line_item.id,
                        "discount_amount": str(discount_amount),
                        "percent": str(pct),
                    },
                )

            invoice.recalculate_totals()

            AuditLog.objects.create(
                user=request.user,
                action="create",
                module="invoice_line_item",
                record_id=str(line_item.id),
                old_value=None,
                new_value=InvoiceLineItemSerializer(line_item, context={"request": request}).data,
            )

        return Response(
            InvoiceLineItemSerializer(line_item, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class InvoiceLineItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a specific invoice line item.
    Recalculates parent invoice totals and logs audit trails.
    URL: /api/billing/line-item/<int:pk>/
    """
    queryset = InvoiceLineItem.objects.all()
    serializer_class = InvoiceLineItemSerializer
    permission_classes = [InvoicePermission]

    def perform_update(self, serializer):
        item = self.get_object()
        old_data = InvoiceLineItemSerializer(item, context={"request": self.request}).data
        with transaction.atomic():
            instance = serializer.save()

            # Re-evaluate discount governance threshold if discount was modified
            settings_cfg = ClinicFinancialSettings.get_settings()
            base_line = instance.unit_price * instance.quantity
            pct = (instance.discount_amount / base_line * Decimal("100.00")) if base_line > Decimal("0.00") else Decimal("0.00")

            if instance.discount_amount > Decimal("0.00"):
                if (
                    pct > settings_cfg.discount_approval_threshold_percent
                    or instance.discount_amount > settings_cfg.discount_approval_threshold_amount
                ):
                    instance.discount_approved = False
                    instance.save(update_fields=["discount_approved"])
                    DiscountApprovalRequest.objects.create(
                        invoice=instance.invoice,
                        line_item=instance,
                        requested_discount_amount=instance.discount_amount,
                        discount_percent=round(pct, 2),
                        reason=instance.notes or "Updated discount exceeds governance threshold",
                        status=DiscountApprovalRequest.Status.PENDING,
                        requested_by=self.request.user,
                    )
                else:
                    instance.discount_approved = True
                    instance.save(update_fields=["discount_approved"])
            else:
                instance.discount_approved = True
                instance.save(update_fields=["discount_approved"])

            instance.invoice.recalculate_totals()

            AuditLog.objects.create(
                user=self.request.user,
                action="update",
                module="invoice_line_item",
                record_id=str(instance.id),
                old_value=old_data,
                new_value=InvoiceLineItemSerializer(instance, context={"request": self.request}).data,
            )

    def perform_destroy(self, instance):
        invoice = instance.invoice
        old_data = InvoiceLineItemSerializer(instance, context={"request": self.request}).data
        record_id = str(instance.id)
        with transaction.atomic():
            instance.delete()
            invoice.recalculate_totals()
            AuditLog.objects.create(
                user=self.request.user,
                action="delete",
                module="invoice_line_item",
                record_id=record_id,
                old_value=old_data,
                new_value=None,
            )


class PriceOverrideView(APIView):
    """
    Explicit price override action on a line item.
    Creates a PriceOverrideLog, recalculates invoice totals, and logs to AuditLog.
    URL: /api/billing/line-item/<int:pk>/override-price/
    """
    permission_classes = [PriceOverridePermission]

    def post(self, request, pk):
        line_item = get_object_or_404(InvoiceLineItem, pk=pk)
        serializer = PriceOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_price = serializer.validated_data["new_price"]
        reason = serializer.validated_data["reason"]
        old_price = line_item.unit_price

        with transaction.atomic():
            override_log = PriceOverrideLog.objects.create(
                line_item=line_item,
                old_price=old_price,
                new_price=new_price,
                reason=reason,
                changed_by=request.user,
            )
            line_item.unit_price = new_price

            # Recheck discount threshold on new base price
            if line_item.discount_amount > Decimal("0.00"):
                base_line = line_item.unit_price * line_item.quantity
                pct = (line_item.discount_amount / base_line * Decimal("100.00")) if base_line > Decimal("0.00") else Decimal("0.00")
                settings_cfg = ClinicFinancialSettings.get_settings()
                if (
                    pct > settings_cfg.discount_approval_threshold_percent
                    or line_item.discount_amount > settings_cfg.discount_approval_threshold_amount
                ):
                    line_item.discount_approved = False
                else:
                    line_item.discount_approved = True

            line_item.save()
            line_item.invoice.recalculate_totals()

            AuditLog.objects.create(
                user=request.user,
                action="price_override",
                module="price_override",
                record_id=str(line_item.id),
                old_value={"unit_price": str(old_price)},
                new_value={"unit_price": str(new_price), "reason": reason, "log_id": override_log.id},
            )

        return Response(
            InvoiceLineItemSerializer(line_item, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class IssueInvoiceView(APIView):
    """
    Moves an invoice from draft to issued status, setting issue_date to today.
    Rejects if the invoice contains no line items.
    URL: /api/billing/invoice/<int:pk>/issue/
    """
    permission_classes = [InvoicePermission]

    def post(self, request, pk):
        invoice = get_object_or_404(Invoice, pk=pk)
        if invoice.status == Invoice.Status.VOID:
            return Response(
                {"error": "Cannot issue a voided invoice."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if invoice.line_items.count() == 0:
            return Response(
                {"error": "Cannot issue an invoice with no line items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            old_status = invoice.status
            invoice.issue_date = timezone.now().date()
            if "due_date" in request.data and request.data["due_date"]:
                invoice.due_date = request.data["due_date"]

            if invoice.status == Invoice.Status.DRAFT:
                invoice.status = Invoice.Status.ISSUED

            invoice.recalculate_totals()

            AuditLog.objects.create(
                user=request.user,
                action="issue",
                module="invoice",
                record_id=str(invoice.id),
                old_value={"status": old_status},
                new_value={
                    "status": invoice.status,
                    "issue_date": str(invoice.issue_date),
                    "due_date": str(invoice.due_date),
                },
            )

        return Response(
            InvoiceDetailSerializer(invoice, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class DiscountApprovalListView(generics.ListAPIView):
    """
    List pending discount approval requests.
    Chief Doctor sees all pending requests; others see only their own requests.
    URL: /api/billing/discount-requests/
    """
    permission_classes = [DiscountApprovalPermission]
    serializer_class = DiscountApprovalRequestSerializer

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)
        if role == "chief_doctor":
            return DiscountApprovalRequest.objects.filter(
                status=DiscountApprovalRequest.Status.PENDING
            ).order_by("-requested_at")
        return DiscountApprovalRequest.objects.filter(requested_by=user).order_by("-requested_at")


class DiscountApprovalActionView(APIView):
    """
    Chief Doctor approve or reject action for a discount approval request.
    URL: /api/billing/discount-requests/<int:pk>/action/
    """
    permission_classes = [DiscountApprovalPermission]

    def post(self, request, pk):
        req_obj = get_object_or_404(DiscountApprovalRequest, pk=pk)
        if req_obj.status != DiscountApprovalRequest.Status.PENDING:
            return Response(
                {"error": f"Discount request has already been {req_obj.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DiscountRequestActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        decision = serializer.validated_data["decision"]
        review_notes = serializer.validated_data.get("review_notes", "")

        with transaction.atomic():
            req_obj.reviewed_by = request.user
            req_obj.reviewed_at = timezone.now()
            req_obj.review_notes = review_notes

            if decision == "approve":
                req_obj.status = DiscountApprovalRequest.Status.APPROVED
                if req_obj.line_item:
                    req_obj.line_item.discount_approved = True
                    req_obj.line_item.save(update_fields=["discount_approved"])
            else:
                req_obj.status = DiscountApprovalRequest.Status.REJECTED
                if req_obj.line_item:
                    req_obj.line_item.discount_approved = False
                    req_obj.line_item.save(update_fields=["discount_approved"])

            req_obj.save()
            req_obj.invoice.recalculate_totals()

            AuditLog.objects.create(
                user=request.user,
                action=f"discount_{decision}",
                module="discount_approval",
                record_id=str(req_obj.id),
                old_value={"status": "pending"},
                new_value={"status": req_obj.status, "review_notes": review_notes},
            )

        return Response(DiscountApprovalRequestSerializer(req_obj).data, status=status.HTTP_200_OK)


class RecordPaymentView(APIView):
    """
    Record payment against an invoice OR record a standalone advance for a patient.
    URLs:
      - /api/billing/invoice/<int:pk>/record-payment/ (invoice payment)
      - /api/billing/payment/advance/ (advance prepayment)
    """
    permission_classes = [PaymentPermission]

    def post(self, request, pk=None):
        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = serializer.validated_data["amount"]
        payment_method = serializer.validated_data["payment_method"]
        reference_number = serializer.validated_data.get("reference_number", "")
        notes = serializer.validated_data.get("notes", "")
        payment_type = serializer.validated_data.get("payment_type", "payment")

        with transaction.atomic():
            if pk:
                invoice = get_object_or_404(Invoice, pk=pk)
                if invoice.status == Invoice.Status.VOID:
                    return Response(
                        {"error": "Cannot record payment for a voided invoice."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                payment = Payment.objects.create(
                    invoice=invoice,
                    patient=invoice.patient,
                    payment_type=payment_type,
                    amount=amount,
                    payment_method=payment_method,
                    reference_number=reference_number,
                    notes=notes,
                    recorded_by=request.user,
                )
                invoice.amount_paid += amount
                invoice.recalculate_totals()
            else:
                patient_id = request.data.get("patient")
                if not patient_id:
                    return Response(
                        {"patient": "Patient ID is required for advance payments."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                patient = get_object_or_404(Patient, pk=patient_id)

                payment = Payment.objects.create(
                    invoice=None,
                    patient=patient,
                    payment_type=payment_type,
                    amount=amount,
                    payment_method=payment_method,
                    reference_number=reference_number,
                    notes=notes,
                    recorded_by=request.user,
                )
                if payment_type == Payment.PaymentType.ADVANCE:
                    account, _ = PatientAccount.objects.get_or_create(patient=patient)
                    account.credit_balance += amount
                    account.save()

            AuditLog.objects.create(
                user=request.user,
                action="create",
                module="payment",
                record_id=str(payment.id),
                old_value=None,
                new_value=PaymentSerializer(payment).data,
            )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class RefundView(APIView):
    """
    Record a refund against an invoice payment or patient credit balance.
    Requires Chief Doctor or Accountant permission and mandatory reason.
    URL: /api/billing/refund/
    """
    permission_classes = [VoidPermission]

    def post(self, request):
        reason = request.data.get("reason")
        if not reason:
            return Response({"reason": "A refund reason is mandatory."}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal(str(request.data.get("amount", 0)))
        if amount <= Decimal("0.00"):
            return Response({"amount": "Refund amount must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = request.data.get("payment_method", "cash")
        reference_number = request.data.get("reference_number", "")
        invoice_id = request.data.get("invoice")
        patient_id = request.data.get("patient")

        with transaction.atomic():
            if invoice_id:
                invoice = get_object_or_404(Invoice, pk=invoice_id)
                if amount > invoice.amount_paid:
                    return Response(
                        {"error": "Refund amount cannot exceed amount paid on this invoice."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                payment = Payment.objects.create(
                    invoice=invoice,
                    patient=invoice.patient,
                    payment_type=Payment.PaymentType.REFUND,
                    amount=amount,
                    payment_method=payment_method,
                    reference_number=reference_number,
                    notes=reason,
                    recorded_by=request.user,
                )
                invoice.amount_paid = max(Decimal("0.00"), invoice.amount_paid - amount)
                invoice.recalculate_totals()
            elif patient_id:
                patient = get_object_or_404(Patient, pk=patient_id)
                account, _ = PatientAccount.objects.get_or_create(patient=patient)
                if amount > account.credit_balance:
                    return Response(
                        {"error": "Refund amount cannot exceed patient available credit balance."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                payment = Payment.objects.create(
                    invoice=None,
                    patient=patient,
                    payment_type=Payment.PaymentType.REFUND,
                    amount=amount,
                    payment_method=payment_method,
                    reference_number=reference_number,
                    notes=reason,
                    recorded_by=request.user,
                )
                account.credit_balance = max(Decimal("0.00"), account.credit_balance - amount)
                account.save()
            else:
                return Response(
                    {"error": "Either invoice or patient must be specified for a refund."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            AuditLog.objects.create(
                user=request.user,
                action="refund",
                module="refund",
                record_id=str(payment.id),
                old_value=None,
                new_value=PaymentSerializer(payment).data,
            )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class VoidInvoiceView(APIView):
    """
    Void an invoice with a mandatory reason. Financial records are NEVER deleted.
    URL: /api/billing/invoice/<int:pk>/void/
    """
    permission_classes = [VoidPermission]

    def post(self, request, pk):
        invoice = get_object_or_404(Invoice, pk=pk)
        if invoice.status == Invoice.Status.VOID:
            return Response({"error": "Invoice is already voided."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VoidSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data["reason"]

        with transaction.atomic():
            old_status = invoice.status
            invoice.status = Invoice.Status.VOID
            invoice.void_reason = reason
            invoice.save(update_fields=["status", "void_reason", "updated_at"])

            AuditLog.objects.create(
                user=request.user,
                action="void",
                module="void",
                record_id=str(invoice.id),
                old_value={"status": old_status},
                new_value={"status": "void", "void_reason": reason},
            )

        return Response(
            {
                "detail": "Invoice voided successfully",
                "invoice": InvoiceDetailSerializer(invoice, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


class VoidPaymentView(APIView):
    """
    Void a payment transaction with a mandatory reason.
    Restores affected invoice amount_paid or patient credit balance.
    URL: /api/billing/payment/<int:pk>/void/
    """
    permission_classes = [VoidPermission]

    def post(self, request, pk):
        payment = get_object_or_404(Payment, pk=pk)
        if payment.is_voided:
            return Response({"error": "Payment is already voided."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VoidSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data["reason"]

        with transaction.atomic():
            payment.is_voided = True
            payment.void_reason = reason
            payment.save(update_fields=["is_voided", "void_reason"])

            # Adjust affected invoice or credit balances
            if payment.invoice:
                if payment.payment_type == Payment.PaymentType.PAYMENT:
                    payment.invoice.amount_paid = max(Decimal("0.00"), payment.invoice.amount_paid - payment.amount)
                elif payment.payment_type == Payment.PaymentType.REFUND:
                    payment.invoice.amount_paid += payment.amount
                payment.invoice.recalculate_totals()
            elif payment.payment_type == Payment.PaymentType.ADVANCE:
                account, _ = PatientAccount.objects.get_or_create(patient=payment.patient)
                account.credit_balance = max(Decimal("0.00"), account.credit_balance - payment.amount)
                account.save()

            AuditLog.objects.create(
                user=request.user,
                action="void",
                module="void",
                record_id=str(payment.id),
                old_value={"is_voided": False},
                new_value={"is_voided": True, "void_reason": reason},
            )

        return Response(
            {
                "detail": "Payment voided successfully",
                "payment": PaymentSerializer(payment).data,
            },
            status=status.HTTP_200_OK,
        )


class PatientAccountView(generics.RetrieveAPIView):
    """
    Retrieve patient running credit balance and aggregate financial summary.
    URL: /api/billing/patient-account/<int:patient_id>/
    """
    permission_classes = [InvoicePermission]

    def get(self, request, patient_id):
        patient = get_object_or_404(Patient, pk=patient_id)
        if request.user.role == "patient" and patient.linked_user_id != request.user.id:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        account, _ = PatientAccount.objects.get_or_create(patient=patient)
        invoices = Invoice.objects.filter(patient=patient).exclude(status=Invoice.Status.VOID)
        agg = invoices.aggregate(
            total_invoiced=models.Sum("grand_total"),
            total_paid=models.Sum("amount_paid"),
            total_outstanding=models.Sum("balance_due"),
        )

        return Response({
            "patient_id": patient.id,
            "patient_name": f"{patient.first_name} {patient.last_name}".strip(),
            "credit_balance": str(account.credit_balance),
            "total_invoiced": str(agg["total_invoiced"] or Decimal("0.00")),
            "total_paid": str(agg["total_paid"] or Decimal("0.00")),
            "total_outstanding": str(agg["total_outstanding"] or Decimal("0.00")),
            "updated_at": account.updated_at,
        })


class OutstandingInvoicesView(generics.ListAPIView):
    """
    List all invoices across patients with balance_due > 0 and status in [issued, partially_paid, overdue].
    The 'who owes us money' query.
    URL: /api/billing/reports/outstanding/
    """
    permission_classes = [InvoicePermission]
    serializer_class = InvoiceListSerializer

    def get_queryset(self):
        return Invoice.objects.filter(
            balance_due__gt=Decimal("0.00"),
            status__in=[Invoice.Status.ISSUED, Invoice.Status.PARTIALLY_PAID, Invoice.Status.OVERDUE],
        ).order_by("-due_date", "-created_at")


class RevenueReportView(APIView):
    """
    Aggregated financial analytics report for clinic leadership.
    Accessible ONLY to Chief Doctor and Accountant.
    URL: /api/billing/reports/revenue/?from=YYYY-MM-DD&to=YYYY-MM-DD
    """
    permission_classes = [InternalCostPermission]

    def get(self, request):
        role = getattr(request.user, "role", None)
        if role not in CAN_VIEW_INTERNAL_COST:
            return Response(
                {"detail": "You do not have permission to view internal financial reports."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from_date_str = request.query_params.get("from")
        to_date_str = request.query_params.get("to")

        invoices = Invoice.objects.filter(
            status__in=[Invoice.Status.ISSUED, Invoice.Status.PARTIALLY_PAID, Invoice.Status.PAID]
        )

        if from_date_str:
            from_d = parse_date(from_date_str)
            if from_d:
                invoices = invoices.filter(
                    models.Q(issue_date__gte=from_d) | models.Q(issue_date__isnull=True, created_at__date__gte=from_d)
                )

        if to_date_str:
            to_d = parse_date(to_date_str)
            if to_d:
                invoices = invoices.filter(
                    models.Q(issue_date__lte=to_d) | models.Q(issue_date__isnull=True, created_at__date__lte=to_d)
                )

        agg = invoices.aggregate(
            total_revenue=models.Sum("grand_total"),
            total_collected=models.Sum("amount_paid"),
            total_outstanding=models.Sum("balance_due"),
            total_discount=models.Sum("total_discount"),
            total_internal_cost=models.Sum("internal_cost_total"),
        )

        total_rev = agg["total_revenue"] or Decimal("0.00")
        total_coll = agg["total_collected"] or Decimal("0.00")
        total_out = agg["total_outstanding"] or Decimal("0.00")
        total_disc = agg["total_discount"] or Decimal("0.00")
        total_cost = agg["total_internal_cost"] or Decimal("0.00")
        gross_margin = total_rev - total_cost
        margin_pct = (gross_margin / total_rev * Decimal("100.00")) if total_rev > Decimal("0.00") else Decimal("0.00")

        return Response({
            "from_date": from_date_str,
            "to_date": to_date_str,
            "invoice_count": invoices.count(),
            "total_revenue": str(total_rev),
            "total_collected": str(total_coll),
            "total_outstanding": str(total_out),
            "total_discount_given": str(total_disc),
            "total_internal_cost": str(total_cost),
            "gross_margin": str(gross_margin),
            "gross_margin_percent": round(float(margin_pct), 2),
        })
