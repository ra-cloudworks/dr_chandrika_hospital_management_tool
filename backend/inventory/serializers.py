from rest_framework import serializers
from .models import ItemCategory, InventoryItem, StockBatch, StockTransaction, Equipment, MaintenanceLog


class ItemCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCategory
        fields = ["id", "name", "description", "created_at"]


class StockBatchSerializer(serializers.ModelSerializer):
    # Read-only boolean flags referencing model properties directly without redundant source kwargs
    is_expired = serializers.BooleanField(read_only=True)
    expires_soon = serializers.BooleanField(read_only=True)
    received_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockBatch
        fields = [
            "id",
            "item",
            "batch_number",
            "quantity_received",
            "quantity_remaining",
            "expiry_date",
            "received_date",
            "supplier_name",
            "supplier_invoice",
            "purchase_cost",
            "received_by",
            "received_by_name",
            "notes",
            "created_at",
            "is_expired",
            "expires_soon",
        ]
        read_only_fields = ["item", "quantity_remaining", "received_by", "created_at"]

    def get_received_by_name(self, obj) -> str:
        if obj.received_by:
            return obj.received_by.get_full_name() or obj.received_by.username
        return ""


class InventoryItemListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    # Read-only boolean property indicating if current_stock <= minimum_stock_level
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "item_code",
            "name",
            "category",
            "category_name",
            "brand",
            "current_stock",
            "minimum_stock_level",
            "unit_of_measure",
            "is_low_stock",
            "is_active",
        ]


class InventoryItemDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    # Read-only boolean property indicating if current_stock <= minimum_stock_level
    is_low_stock = serializers.BooleanField(read_only=True)
    batches = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "item_code",
            "name",
            "category",
            "category_name",
            "brand",
            "manufacturer",
            "unit_of_measure",
            "current_stock",
            "minimum_stock_level",
            "reorder_quantity",
            "unit_cost",
            "selling_price",
            "storage_location",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
            "is_low_stock",
            "batches",
        ]
        read_only_fields = ["item_code", "current_stock", "created_at", "updated_at"]

    def get_batches(self, obj):
        # Order batches by expiry_date ascending so earliest-expiring batch shows first
        queryset = obj.batches.all().order_by("expiry_date", "id")
        return StockBatchSerializer(queryset, many=True).data


class StockTransactionSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = StockTransaction
        fields = [
            "id",
            "item",
            "batch",
            "transaction_type",
            "quantity",
            "reason",
            "performed_by",
            "performed_by_name",
            "performed_at",
        ]
        read_only_fields = ["item", "performed_by", "performed_at"]

    def get_performed_by_name(self, obj) -> str:
        if obj.performed_by:
            return obj.performed_by.get_full_name() or obj.performed_by.username
        return ""


class EquipmentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            "id",
            "equipment_code",
            "name",
            "status",
            "location",
            "warranty_expiry",
        ]


class MaintenanceLogSerializer(serializers.ModelSerializer):
    performed_by_staff_name = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceLog
        fields = [
            "id",
            "equipment",
            "maintenance_type",
            "description",
            "performed_by_staff",
            "performed_by_staff_name",
            "external_technician",
            "service_date",
            "next_due_date",
            "cost",
            "notes",
            "created_at",
        ]
        read_only_fields = ["equipment", "performed_by_staff", "created_at"]

    def get_performed_by_staff_name(self, obj) -> str:
        if obj.performed_by_staff:
            return obj.performed_by_staff.get_full_name() or obj.performed_by_staff.username
        return ""


class EquipmentDetailSerializer(serializers.ModelSerializer):
    maintenance_logs = serializers.SerializerMethodField()

    class Meta:
        model = Equipment
        fields = [
            "id",
            "equipment_code",
            "name",
            "model_number",
            "serial_number",
            "manufacturer",
            "location",
            "purchase_date",
            "warranty_expiry",
            "status",
            "notes",
            "created_at",
            "updated_at",
            "maintenance_logs",
        ]
        read_only_fields = ["equipment_code", "created_at", "updated_at"]

    def get_maintenance_logs(self, obj):
        # Order maintenance logs by service_date descending
        queryset = obj.maintenance_logs.all().order_by("-service_date", "-id")
        return MaintenanceLogSerializer(queryset, many=True).data
