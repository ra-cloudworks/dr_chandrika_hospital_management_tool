from django.contrib import admin
from .models import ItemCategory, InventoryItem, StockBatch, StockTransaction, Equipment, MaintenanceLog


class StockBatchInline(admin.TabularInline):
    model = StockBatch
    extra = 0
    readonly_fields = ("created_at", "received_date")


class MaintenanceLogInline(admin.TabularInline):
    model = MaintenanceLog
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(ItemCategory)
class ItemCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at")
    search_fields = ("name",)


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = (
        "item_code",
        "name",
        "category",
        "current_stock",
        "minimum_stock_level",
        "unit_of_measure",
        "is_active",
    )
    list_filter = ("category", "is_active")
    search_fields = ("name", "item_code", "brand", "manufacturer")
    inlines = [StockBatchInline]


@admin.register(StockBatch)
class StockBatchAdmin(admin.ModelAdmin):
    list_display = (
        "batch_number",
        "item",
        "quantity_received",
        "quantity_remaining",
        "expiry_date",
        "supplier_name",
    )
    list_filter = ("expiry_date", "received_date")
    search_fields = ("batch_number", "item__name", "supplier_name", "supplier_invoice")


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "item",
        "batch",
        "transaction_type",
        "quantity",
        "performed_by",
        "performed_at",
    )
    list_filter = ("transaction_type", "performed_at")
    search_fields = ("item__name", "reason", "batch__batch_number")


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ("equipment_code", "name", "status", "location", "warranty_expiry")
    list_filter = ("status", "location")
    search_fields = ("name", "equipment_code", "model_number", "serial_number")
    inlines = [MaintenanceLogInline]


@admin.register(MaintenanceLog)
class MaintenanceLogAdmin(admin.ModelAdmin):
    list_display = (
        "equipment",
        "maintenance_type",
        "service_date",
        "next_due_date",
        "cost",
        "performed_by_staff",
    )
    list_filter = ("maintenance_type", "service_date")
    search_fields = ("equipment__name", "description", "external_technician")
