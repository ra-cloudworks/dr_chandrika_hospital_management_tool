from datetime import date, timedelta
from django.db import transaction
from django.db.models import F, Max, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from accounts.models import AuditLog
from .models import ItemCategory, InventoryItem, StockBatch, StockTransaction, Equipment, MaintenanceLog
from .permissions import InventoryPermission, EquipmentPermission
from .serializers import (
    ItemCategorySerializer,
    InventoryItemListSerializer,
    InventoryItemDetailSerializer,
    StockBatchSerializer,
    StockTransactionSerializer,
    EquipmentListSerializer,
    EquipmentDetailSerializer,
    MaintenanceLogSerializer,
)


class ItemCategoryListCreateView(generics.ListCreateAPIView):
    """
    List all item categories or create a new inventory category.
    """
    queryset = ItemCategory.objects.all().order_by("name")
    serializer_class = ItemCategorySerializer
    permission_classes = [InventoryPermission]

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="create",
            module="item_category",
            record_id=str(instance.id),
            old_value=None,
            new_value=serializer.data,
        )


class InventoryItemListCreateView(generics.ListCreateAPIView):
    """
    List inventory items with filtering (category_id, low_stock, search) or create a new item.
    """
    permission_classes = [InventoryPermission]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return InventoryItemDetailSerializer
        return InventoryItemListSerializer

    def get_queryset(self):
        queryset = InventoryItem.objects.all().order_by("-id")
        category_id = self.request.query_params.get("category_id")
        low_stock = self.request.query_params.get("low_stock")
        search = self.request.query_params.get("search")

        if category_id:
            queryset = queryset.filter(category_id=category_id)

        if low_stock and low_stock.lower() in ["true", "1"]:
            queryset = queryset.filter(current_stock__lte=F("minimum_stock_level"))

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="create",
            module="inventory_item",
            record_id=str(instance.id),
            old_value=None,
            new_value=serializer.data,
        )


class InventoryItemDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update details of a specific inventory item.
    """
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemDetailSerializer
    permission_classes = [InventoryPermission]

    def perform_update(self, serializer):
        old_data = InventoryItemDetailSerializer(self.get_object()).data
        instance = serializer.save()
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="update",
            module="inventory_item",
            record_id=str(instance.id),
            old_value=old_data,
            new_value=serializer.data,
        )


class StockBatchCreateView(APIView):
    """
    Receive new delivery batch of stock for a specific item.
    Atomically updates item current stock and logs a 'received' StockTransaction.
    """
    permission_classes = [InventoryPermission]

    def post(self, request, item_id):
        item = get_object_or_404(InventoryItem, pk=item_id)
        serializer = StockBatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        quantity_received = serializer.validated_data["quantity_received"]
        if quantity_received <= 0:
            return Response(
                {"error": "Quantity received must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # Create batch record
            batch = serializer.save(
                item=item,
                quantity_remaining=quantity_received,
                received_by=request.user if request.user.is_authenticated else None,
            )

            # Create corresponding received stock transaction
            StockTransaction.objects.create(
                item=item,
                batch=batch,
                transaction_type="received",
                quantity=quantity_received,
                reason=f"Received batch {batch.batch_number} from {batch.supplier_name or 'supplier'}",
                performed_by=request.user if request.user.is_authenticated else None,
            )

            # Update parent item stock summary
            item.current_stock += quantity_received
            item.save()

            # Audit log
            batch_data = StockBatchSerializer(batch).data
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action="create",
                module="stock_batch",
                record_id=str(batch.id),
                old_value=None,
                new_value=batch_data,
            )

        return Response(batch_data, status=status.HTTP_201_CREATED)


class StockTransactionListCreateView(APIView):
    """
    List transactions for a stock item or log a consumption / adjustment / disposal transaction.
    Atomically syncs InventoryItem.current_stock and StockBatch.quantity_remaining.
    """
    permission_classes = [InventoryPermission]

    def get(self, request, item_id):
        item = get_object_or_404(InventoryItem, pk=item_id)
        transactions = item.transactions.all().order_by("-performed_at", "-id")
        serializer = StockTransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, item_id):
        item = get_object_or_404(InventoryItem, pk=item_id)
        serializer = StockTransactionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        transaction_type = serializer.validated_data["transaction_type"]
        raw_quantity = serializer.validated_data["quantity"]
        batch = serializer.validated_data.get("batch")

        # Determine effective signed quantity (negative for consumption/disposal, positive for received/returned)
        if transaction_type in ["consumed", "disposed"]:
            qty_to_deduct = abs(raw_quantity)
            if qty_to_deduct > item.current_stock:
                return Response(
                    {"error": f"Insufficient stock available. Current stock is {item.current_stock}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if batch and qty_to_deduct > batch.quantity_remaining:
                return Response(
                    {"error": f"Insufficient batch stock available. Batch has {batch.quantity_remaining} remaining."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            effective_quantity = -qty_to_deduct
        elif transaction_type == "adjusted":
            # For adjustment, raw quantity can be positive or negative
            if raw_quantity < 0 and abs(raw_quantity) > item.current_stock:
                return Response(
                    {"error": f"Insufficient stock available for reduction. Current stock is {item.current_stock}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            effective_quantity = raw_quantity
        else:  # received, returned
            effective_quantity = abs(raw_quantity)

        with transaction.atomic():
            st = serializer.save(
                item=item,
                quantity=effective_quantity,
                performed_by=request.user if request.user.is_authenticated else None,
            )

            # Update item current stock
            item.current_stock += effective_quantity
            item.save()

            # Update batch remaining quantity if batch is attached
            if batch:
                batch.quantity_remaining += effective_quantity
                batch.save()

            st_data = StockTransactionSerializer(st).data
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action="create",
                module="stock_transaction",
                record_id=str(st.id),
                old_value=None,
                new_value=st_data,
            )

        # Check if item is now in low stock condition
        if item.is_low_stock:
            st_data["low_stock_warning"] = True

        return Response(st_data, status=status.HTTP_201_CREATED)


class LowStockAlertView(generics.ListAPIView):
    """
    Returns active items where current_stock <= minimum_stock_level.
    """
    serializer_class = InventoryItemListSerializer
    permission_classes = [InventoryPermission]

    def get_queryset(self):
        return InventoryItem.objects.filter(
            is_active=True,
            current_stock__lte=F("minimum_stock_level"),
        ).order_by("name")


class ExpiringBatchesView(generics.ListAPIView):
    """
    Returns stock batches expiring within the next 30 days that still have remaining stock.
    """
    serializer_class = StockBatchSerializer
    permission_classes = [InventoryPermission]

    def get_queryset(self):
        today = date.today()
        in_30_days = today + timedelta(days=30)
        return StockBatch.objects.filter(
            expiry_date__range=[today, in_30_days],
            quantity_remaining__gt=0,
        ).order_by("expiry_date")


class EquipmentListCreateView(generics.ListCreateAPIView):
    """
    List equipment assets or create a new equipment profile.
    """
    queryset = Equipment.objects.all().order_by("-id")
    permission_classes = [EquipmentPermission]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return EquipmentDetailSerializer
        return EquipmentListSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="create",
            module="equipment",
            record_id=str(instance.id),
            old_value=None,
            new_value=serializer.data,
        )


class EquipmentDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update details for a specific equipment piece.
    """
    queryset = Equipment.objects.all()
    serializer_class = EquipmentDetailSerializer
    permission_classes = [EquipmentPermission]

    def perform_update(self, serializer):
        old_data = EquipmentDetailSerializer(self.get_object()).data
        instance = serializer.save()
        AuditLog.objects.create(
            user=self.request.user if self.request.user.is_authenticated else None,
            action="update",
            module="equipment",
            record_id=str(instance.id),
            old_value=old_data,
            new_value=serializer.data,
        )


class MaintenanceLogListCreateView(APIView):
    """
    List maintenance logs for equipment or log a new service/calibration/repair event.
    """
    permission_classes = [EquipmentPermission]

    def get(self, request, equipment_id):
        equipment = get_object_or_404(Equipment, pk=equipment_id)
        logs = equipment.maintenance_logs.all().order_by("-service_date", "-id")
        serializer = MaintenanceLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, equipment_id):
        equipment = get_object_or_404(Equipment, pk=equipment_id)
        serializer = MaintenanceLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        instance = serializer.save(
            equipment=equipment,
            performed_by_staff=request.user if request.user.is_authenticated else None,
        )
        log_data = MaintenanceLogSerializer(instance).data

        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action="create",
            module="maintenance_log",
            record_id=str(instance.id),
            old_value=None,
            new_value=log_data,
        )

        return Response(log_data, status=status.HTTP_201_CREATED)


class EquipmentDueForMaintenanceView(generics.ListAPIView):
    """
    Returns active equipment where the latest next_due_date is past or within 7 days, or never serviced.
    """
    serializer_class = EquipmentListSerializer
    permission_classes = [EquipmentPermission]

    def get_queryset(self):
        cutoff_date = date.today() + timedelta(days=7)
        return Equipment.objects.filter(status="active").annotate(
            next_maintenance=Max("maintenance_logs__next_due_date")
        ).filter(
            Q(next_maintenance__lte=cutoff_date) | Q(next_maintenance__isnull=True)
        ).order_by("id")
