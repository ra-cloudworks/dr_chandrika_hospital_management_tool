from rest_framework.permissions import BasePermission, SAFE_METHODS

CAN_WRITE_CHART = {"chief_doctor", "doctor"}
CAN_WRITE_ROUTINE = {"chief_doctor", "doctor", "assistant"}


class ToothRecordPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role == "patient":
            return request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return True  # any staff role can view
        return user.role in CAN_WRITE_ROUTINE

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == "patient":
            return request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return True
        if request.method == "DELETE":
            return user.role == "chief_doctor"
        return user.role in CAN_WRITE_ROUTINE