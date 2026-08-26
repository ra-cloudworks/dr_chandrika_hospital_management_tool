from rest_framework.permissions import BasePermission


class IsChiefDoctor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "chief_doctor"


class IsOwnerOrChiefDoctor(BasePermission):
    """Staff can access their own record; Chief Doctor can access anyone's."""
    def has_object_permission(self, request, view, obj):
        return obj == request.user or request.user.role == "chief_doctor"


class IsClinicStaff(BasePermission):
    """Any staff role, but not patients."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role != "patient"