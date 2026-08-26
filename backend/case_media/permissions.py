from rest_framework.permissions import BasePermission, SAFE_METHODS

CAN_VIEW = {"chief_doctor", "doctor", "assistant", "receptionist"}
CAN_WRITE_CLINICAL = {"chief_doctor", "doctor", "assistant"}   # photos, x-rays
CAN_WRITE_DOCUMENT = {"chief_doctor", "doctor", "assistant", "receptionist"}  # documents (e.g. ID proof, referral)


class MediaFilePermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role == "patient":
            return request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return user.role in CAN_VIEW
        media_type = request.data.get("media_type", "")
        if media_type == "document":
            return user.role in CAN_WRITE_DOCUMENT
        return user.role in CAN_WRITE_CLINICAL

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == "patient":
            return obj.patient.linked_user_id == user.id and request.method in SAFE_METHODS
        if request.method in SAFE_METHODS:
            return user.role in CAN_VIEW
        if obj.media_type == "document":
            return user.role in CAN_WRITE_DOCUMENT
        return user.role in CAN_WRITE_CLINICAL


class ChiefDoctorOnly(BasePermission):
    """Used only for the soft-delete action — matches the client requirement
    that deletion needs Chief Doctor approval."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "chief_doctor"