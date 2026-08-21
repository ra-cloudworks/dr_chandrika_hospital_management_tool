from rest_framework.permissions import BasePermission, SAFE_METHODS

CAN_WRITE_PLAN = {"chief_doctor", "doctor"}
CAN_VIEW_PLAN = {"chief_doctor", "doctor", "assistant", "receptionist", "accountant"}


class TreatmentPlanPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role == "patient":
            return request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return user.role in CAN_VIEW_PLAN
        return user.role in CAN_WRITE_PLAN

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == "patient":
            return obj.patient.linked_user_id == user.id and request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return user.role in CAN_VIEW_PLAN
        return user.role in CAN_WRITE_PLAN


class IsPatientOwnerForConsent(BasePermission):
    """Only the patient's own portal login can accept/reject their plan — not staff on their behalf."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "patient"