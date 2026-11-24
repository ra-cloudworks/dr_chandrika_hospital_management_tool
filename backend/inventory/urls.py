from django.urls import path
from .views import (
    ItemCategoryListCreateView,
    InventoryItemListCreateView,
    InventoryItemDetailView,
    StockBatchCreateView,
    StockTransactionListCreateView,
    LowStockAlertView,
    ExpiringBatchesView,
    EquipmentListCreateView,
    EquipmentDetailView,
    MaintenanceLogListCreateView,
    EquipmentDueForMaintenanceView,
)

urlpatterns = [
    # Category endpoints
    path("categories/", ItemCategoryListCreateView.as_view(), name="category-list-create"),

    # Alerts endpoints
    path("alerts/low-stock/", LowStockAlertView.as_view(), name="alert-low-stock"),
    path("alerts/expiring/", ExpiringBatchesView.as_view(), name="alert-expiring-batches"),

    # Stock items endpoints
    path("items/", InventoryItemListCreateView.as_view(), name="item-list-create"),
    path("items/<int:pk>/", InventoryItemDetailView.as_view(), name="item-detail"),
    path("items/<int:item_id>/batches/", StockBatchCreateView.as_view(), name="batch-create"),
    path("items/<int:item_id>/transactions/", StockTransactionListCreateView.as_view(), name="transaction-list-create"),

    # Equipment endpoints
    path("equipment/due-maintenance/", EquipmentDueForMaintenanceView.as_view(), name="equipment-due-maintenance"),
    path("equipment/", EquipmentListCreateView.as_view(), name="equipment-list-create"),
    path("equipment/<int:pk>/", EquipmentDetailView.as_view(), name="equipment-detail"),
    path("equipment/<int:equipment_id>/maintenance/", MaintenanceLogListCreateView.as_view(), name="maintenance-log-list-create"),
]
