from rest_framework.permissions import BasePermission, SAFE_METHODS

STAFF_ROLES = {"chief_doctor", "doctor", "assistant", "receptionist", "accountant"}
CAN_CREATE_PATIENT = {"chief_doctor", "receptionist"}
CAN_EDIT_DEMOGRAPHICS = {"chief_doctor", "receptionist"}
CAN_EDIT_MEDICAL = {"chief_doctor", "doctor", "assistant"}


class PatientAccessPermission(BasePermission):
    """List/Create endpoint."""

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role == "patient":
            return request.method in SAFE_METHODS
        if request.method == "POST":
            return user.role in CAN_CREATE_PATIENT
        return user.role in STAFF_ROLES


class PatientObjectPermission(BasePermission):
    """Retrieve/Update/Delete endpoint."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == "patient":
            return obj.linked_user_id == user.id and request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return user.role in STAFF_ROLES
        if request.method == "DELETE":
            return user.role == "chief_doctor"
        return user.role in CAN_EDIT_DEMOGRAPHICS or user.role == "chief_doctor"


class MedicalRecordPermission(BasePermission):
    """Medical history / allergies sub-resources."""

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role == "patient":
            return request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return user.role in STAFF_ROLES
        return user.role in CAN_EDIT_MEDICAL