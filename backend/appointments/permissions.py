from rest_framework.permissions import BasePermission, SAFE_METHODS

CAN_MANAGE = {"chief_doctor", "receptionist"}
CAN_VIEW_ALL = {"chief_doctor", "doctor", "assistant", "receptionist"}


class AppointmentPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role == "patient":
            return True  # can create/view — scoped to their own records in the queryset/perform_create
        if request.method in SAFE_METHODS:
            return user.role in CAN_VIEW_ALL
        return user.role in CAN_MANAGE or user.role == "doctor"

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == "patient":
            return bool(obj.patient) and obj.patient.linked_user_id == user.id
        if request.method in SAFE_METHODS:
            return user.role in CAN_VIEW_ALL
        if user.role == "doctor":
            return obj.doctor_id == user.id  # doctor can only act on their own appointments
        return user.role in CAN_MANAGE


class StaffOnlyPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in CAN_MANAGE