from rest_framework.permissions import BasePermission, SAFE_METHODS

CAN_VIEW_INTERNAL_COST = {"chief_doctor", "accountant"}
CAN_CREATE_INVOICE = {"chief_doctor", "doctor", "receptionist", "accountant"}
CAN_RECORD_PAYMENT = {"chief_doctor", "receptionist", "accountant"}
CAN_APPROVE_DISCOUNT = {"chief_doctor"}
CAN_VOID = {"chief_doctor", "accountant"}
CAN_OVERRIDE_PRICE = {"chief_doctor", "doctor"}
CAN_VIEW_BILLING = {"chief_doctor", "doctor", "assistant", "receptionist", "accountant"}


class InvoicePermission(BasePermission):
    """
    Permission class for Invoices and Invoice Line Items.
    - Staff roles in CAN_VIEW_BILLING can read.
    - Staff in CAN_CREATE_INVOICE can create/update.
    - Patient role can view ONLY their own invoices (safe methods only).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, "role", None)
        if role == "patient":
            return request.method in SAFE_METHODS

        if request.method in SAFE_METHODS:
            return role in CAN_VIEW_BILLING

        return role in CAN_CREATE_INVOICE

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, "role", None)

        # Check if the target object is an Invoice or InvoiceLineItem
        patient = getattr(obj, "patient", None)
        if patient is None and hasattr(obj, "invoice"):
            patient = obj.invoice.patient

        if role == "patient":
            if request.method not in SAFE_METHODS:
                return False
            return patient is not None and patient.linked_user_id == request.user.id

        if request.method in SAFE_METHODS:
            return role in CAN_VIEW_BILLING

        return role in CAN_CREATE_INVOICE


class PaymentPermission(BasePermission):
    """
    Permission class for recording/viewing payments.
    - Staff roles in CAN_RECORD_PAYMENT can record payments.
    - Staff in CAN_VIEW_BILLING can view payment records.
    - Patient can view only payments tied to their own patient profile.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, "role", None)
        if role == "patient":
            return request.method in SAFE_METHODS

        if request.method in SAFE_METHODS:
            return role in CAN_VIEW_BILLING

        return role in CAN_RECORD_PAYMENT

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, "role", None)
        if role == "patient":
            return (
                request.method in SAFE_METHODS
                and obj.patient is not None
                and obj.patient.linked_user_id == request.user.id
            )

        if request.method in SAFE_METHODS:
            return role in CAN_VIEW_BILLING

        return role in CAN_RECORD_PAYMENT


class DiscountApprovalPermission(BasePermission):
    """
    Permission class for discount approval requests.
    - Only Chief Doctor can approve/reject.
    - Other staff can view their own requests.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, "role", None)
        if role == "patient":
            return False

        # If it's an action view (approve/reject POST), only Chief Doctor
        if request.method not in SAFE_METHODS:
            return role in CAN_APPROVE_DISCOUNT

        return role in CAN_VIEW_BILLING


class InternalCostPermission(BasePermission):
    """
    Only Chief Doctor and Accountant can view clinic margin / internal cost reports.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, "role", None) in CAN_VIEW_INTERNAL_COST


class VoidPermission(BasePermission):
    """
    Only Chief Doctor and Accountant can void invoices or payments, or process refunds.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, "role", None) in CAN_VOID


class PriceOverridePermission(BasePermission):
    """
    Only Chief Doctor and Doctor can override line item prices.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, "role", None) in CAN_OVERRIDE_PRICE


class ClinicSettingsPermission(BasePermission):
    """
    Staff can view clinic financial settings; only Chief Doctor can update.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = getattr(request.user, "role", None)
        if request.method in SAFE_METHODS:
            return role in CAN_VIEW_BILLING
        return role in CAN_APPROVE_DISCOUNT

