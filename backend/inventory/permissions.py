from rest_framework.permissions import BasePermission, SAFE_METHODS

# Define role sets as specified in requirements
CAN_MANAGE_INVENTORY = {"chief_doctor", "assistant"}
CAN_VIEW_INVENTORY = {"chief_doctor", "doctor", "assistant", "receptionist", "accountant"}
CAN_MANAGE_EQUIPMENT = {"chief_doctor"}
CAN_LOG_MAINTENANCE = {"chief_doctor", "assistant"}


class InventoryPermission(BasePermission):
    """
    Permission class for Inventory items, categories, batches, and transactions.
    - View/Read: All staff roles (Chief Doctor, Doctor, Assistant, Receptionist, Accountant).
    - Manage/Write: Chief Doctor and Assistant only.
    - Patient: No access.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = getattr(request.user, "role", None)
        if user_role == "patient" or not user_role:
            return False

        if request.method in SAFE_METHODS:
            return user_role in CAN_VIEW_INVENTORY
        
        return user_role in CAN_MANAGE_INVENTORY


class EquipmentPermission(BasePermission):
    """
    Permission class for Equipment and Maintenance logs.
    - View/Read: All staff roles.
    - Manage Equipment (Create/Update/Decommission): Chief Doctor only.
    - Log Maintenance: Chief Doctor and Assistant.
    - Patient: No access.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        user_role = getattr(request.user, "role", None)
        if user_role == "patient" or not user_role:
            return False

        if request.method in SAFE_METHODS:
            return user_role in CAN_VIEW_INVENTORY

        # Check if the current view is for Maintenance Logs or Equipment itself
        view_name = view.__class__.__name__
        if "Maintenance" in view_name:
            return user_role in CAN_LOG_MAINTENANCE

        return user_role in CAN_MANAGE_EQUIPMENT
