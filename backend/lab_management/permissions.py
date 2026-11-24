from rest_framework import permissions

# Define role-based permission sets for Laboratory Management
CAN_MANAGE_LABS = {"chief_doctor"}
CAN_CREATE_ORDER = {"chief_doctor", "doctor"}
CAN_VIEW_ORDER = {"chief_doctor", "doctor", "assistant", "receptionist", "accountant"}
CAN_UPDATE_ORDER = {"chief_doctor", "doctor", "assistant"}


class DentalLabPermission(permissions.BasePermission):
    """
    Permission class for DentalLab management:
    - Only chief_doctor can add or edit external lab profiles.
    - All clinic staff roles can view lab profiles.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)

        # Allow safe read methods for all clinic staff roles
        if request.method in permissions.SAFE_METHODS:
            return user_role in CAN_VIEW_ORDER

        # Create/Update/Delete operations require chief_doctor role
        return user_role in CAN_MANAGE_LABS


class LabOrderPermission(permissions.BasePermission):
    """
    Permission class for LabOrder lifecycle:
    - View access: All staff roles (chief_doctor, doctor, assistant, receptionist, accountant).
    - Create access: Doctors and chief_doctor.
    - Update access: Doctors, chief_doctor, and assistant.
    - Object-level guard: Assistant can only update logistics fields (courier, dates); clinical fields require ordering doctor or chief_doctor.
    """

    LOGISTICS_FIELDS = {
        "courier_name",
        "courier_tracking",
        "promised_delivery_date",
        "actual_delivery_date",
        "date_sent",
        "trial_date",
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)

        # Patients have no access to lab orders
        if user_role == "patient":
            return False

        if request.method in permissions.SAFE_METHODS:
            return user_role in CAN_VIEW_ORDER

        if request.method == "POST":
            return user_role in CAN_CREATE_ORDER

        if request.method in ["PUT", "PATCH"]:
            return user_role in CAN_UPDATE_ORDER

        return False

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)

        if request.method in permissions.SAFE_METHODS:
            return user_role in CAN_VIEW_ORDER

        # Chief doctor and ordering doctor can update any fields
        if user_role == "chief_doctor" or obj.ordering_doctor == request.user:
            return True

        # Assistants are restricted to updating logistics fields only
        if user_role == "assistant":
            # Inspect requested changes in payload if available
            updated_fields = set(request.data.keys())
            if updated_fields.issubset(self.LOGISTICS_FIELDS):
                return True
            return False

        return False
