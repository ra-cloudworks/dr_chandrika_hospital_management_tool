from rest_framework.permissions import BasePermission, SAFE_METHODS

# Roles authorized to register patients and resolve/merge duplicate records
CAN_RESOLVE_DUPLICATES = {"chief_doctor", "receptionist"}


class IsChiefDoctor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "chief_doctor"


class CanResolveDuplicates(BasePermission):
    """Staff authorized to create patients (Chief Doctor and Receptionist) can dismiss or merge duplicates."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in CAN_RESOLVE_DUPLICATES


class CanViewFlagsOrChiefDoctorActs(BasePermission):
    """Staff members can view flags; patient creators can dismiss or merge."""

    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return user.role in {"chief_doctor", "doctor", "receptionist", "assistant"}
        return user.role in CAN_RESOLVE_DUPLICATES