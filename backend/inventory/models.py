from datetime import date, timedelta
from django.db import models
from django.conf import settings


# TODO: Wire automatic stock deduction from case_files.MaterialUsed when a visit note is saved.
# Note: LabOrder implant serial numbers and lab materials can cross-reference inventory.


class ItemCategory(models.Model):
    """
    Organizes inventory into browsable groups (e.g., Anesthetics, PPE, Composites).
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Item Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class InventoryItem(models.Model):
    """
    Represents a specific consumable item stocked by the dental clinic.
    Tracks stock quantities, cost/price, reorder thresholds, and batch history.
    """
    item_code = models.CharField(max_length=20, unique=True, editable=False)
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        ItemCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="items",
    )
    brand = models.CharField(max_length=100, blank=True)
    manufacturer = models.CharField(max_length=150, blank=True)
    unit_of_measure = models.CharField(max_length=30)  # pack, box, capsule, ml, unit, roll, etc.
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    minimum_stock_level = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reorder_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    storage_location = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-id"]

    def save(self, *args, **kwargs):
        # Auto-generate unique sequential item_code (INV00001, INV00002...)
        if not self.item_code:
            last = InventoryItem.objects.order_by("id").last()
            next_id = (last.id + 1) if last else 1
            self.item_code = f"INV{next_id:05d}"
        super().save(*args, **kwargs)

    @property
    def is_low_stock(self) -> bool:
        """Returns True if current stock is at or below the minimum stock threshold."""
        return self.current_stock <= self.minimum_stock_level

    def __str__(self):
        return f"{self.item_code} - {self.name}"


class StockBatch(models.Model):
    """
    Tracks individual batches/lots of a stocked item with expiry dates and supplier invoices.
    """
    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="batches",
    )
    batch_number = models.CharField(max_length=100)
    quantity_received = models.DecimalField(max_digits=10, decimal_places=2)
    quantity_remaining = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateField(null=True, blank=True)
    received_date = models.DateField(auto_now_add=True)
    supplier_name = models.CharField(max_length=150, blank=True)
    supplier_invoice = models.CharField(max_length=100, blank=True)
    purchase_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_batches_received",
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Stock Batches"
        ordering = ["expiry_date", "id"]

    @property
    def is_expired(self) -> bool:
        """Returns True if batch has passed its expiration date."""
        return self.expiry_date is not None and self.expiry_date < date.today()

    @property
    def expires_soon(self) -> bool:
        """Returns True if batch expires within the next 30 days and is not yet expired."""
        if not self.expiry_date:
            return False
        today = date.today()
        return today <= self.expiry_date <= (today + timedelta(days=30))

    def __str__(self):
        return f"{self.item.name} - Batch {self.batch_number}"


class StockTransaction(models.Model):
    """
    Logs every physical movement of inventory (receiving, consumption, adjustments, disposals, returns).
    """
    TRANSACTION_TYPES = [
        ("received", "Received"),
        ("consumed", "Consumed"),
        ("adjusted", "Adjusted"),
        ("disposed", "Disposed"),
        ("returned", "Returned"),
    ]

    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    batch = models.ForeignKey(
        StockBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # Positive for in, negative for out
    reason = models.CharField(max_length=255, blank=True)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="stock_transactions_performed",
    )
    performed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-performed_at"]

    def __str__(self):
        return f"{self.transaction_type} {self.quantity} for {self.item.name}"


class Equipment(models.Model):
    """
    Tracks clinic machinery and tools requiring scheduled maintenance and calibrations.
    """
    STATUS_CHOICES = [
        ("active", "Active"),
        ("under_maintenance", "Under Maintenance"),
        ("decommissioned", "Decommissioned"),
    ]

    equipment_code = models.CharField(max_length=20, unique=True, editable=False)
    name = models.CharField(max_length=200)
    model_number = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    manufacturer = models.CharField(max_length=150, blank=True)
    location = models.CharField(max_length=100, blank=True)  # e.g., Treatment Room 1
    purchase_date = models.DateField(null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Equipment"
        ordering = ["-id"]

    def save(self, *args, **kwargs):
        # Auto-generate unique sequential equipment_code (EQP00001, EQP00002...)
        if not self.equipment_code:
            last = Equipment.objects.order_by("id").last()
            next_id = (last.id + 1) if last else 1
            self.equipment_code = f"EQP{next_id:05d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.equipment_code} - {self.name}"


class MaintenanceLog(models.Model):
    """
    Records maintenance, calibrations, repairs, and inspections for equipment.
    """
    MAINTENANCE_TYPES = [
        ("calibration", "Calibration"),
        ("repair", "Repair"),
        ("cleaning", "Cleaning"),
        ("inspection", "Inspection"),
        ("replacement", "Replacement"),
    ]

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="maintenance_logs",
    )
    maintenance_type = models.CharField(max_length=15, choices=MAINTENANCE_TYPES)
    description = models.TextField()
    performed_by_staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="equipment_maintenances_handled",
    )
    external_technician = models.CharField(max_length=150, blank=True)
    service_date = models.DateField()
    next_due_date = models.DateField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-service_date"]

    def __str__(self):
        return f"{self.equipment.name} - {self.maintenance_type} on {self.service_date}"
