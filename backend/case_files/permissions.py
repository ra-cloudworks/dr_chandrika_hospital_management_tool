from rest_framework.permissions import BasePermission, SAFE_METHODS

CAN_WRITE_CASE = {"chief_doctor", "doctor", "assistant"}
CAN_VIEW_CASE = {"chief_doctor", "doctor", "assistant", "receptionist"}


class CasePermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role == "patient":
            return request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return user.role in CAN_VIEW_CASE
        return user.role in CAN_WRITE_CASE

    def has_object_permission(self, request, view, obj):
        user = request.user
        patient = obj.patient if hasattr(obj, "patient") else obj.case.patient
        if user.role == "patient":
            return patient.linked_user_id == user.id and request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return user.role in CAN_VIEW_CASE
        return user.role in CAN_WRITE_CASE