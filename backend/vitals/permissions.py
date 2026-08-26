from rest_framework.permissions import BasePermission, SAFE_METHODS

CAN_RECORD_VITALS = {"chief_doctor", "doctor", "assistant"}


class VitalsPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role == "patient":
            return request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return user.role in CAN_RECORD_VITALS
        return user.role in CAN_RECORD_VITALS