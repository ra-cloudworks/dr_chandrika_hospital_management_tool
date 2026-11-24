// Type definitions for Module 12: Inventory & Equipment Management

export type TransactionType = "received" | "consumed" | "adjusted" | "disposed" | "returned";
export type EquipmentStatus = "active" | "under_maintenance" | "decommissioned";
export type MaintenanceType = "calibration" | "repair" | "cleaning" | "inspection" | "replacement";

export interface ItemCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface StockBatch {
  id: number;
  item: number;
  batch_number: string;
  quantity_received: number;
  quantity_remaining: number;
  expiry_date: string | null;
  received_date: string;
  supplier_name: string;
  supplier_invoice: string;
  purchase_cost: number;
  received_by?: number | null;
  received_by_name?: string;
  notes: string;
  created_at: string;
  is_expired: boolean;
  expires_soon: boolean;
}

export interface InventoryItemListItem {
  id: number;
  item_code: string;
  name: string;
  category: number | null;
  category_name: string;
  brand: string;
  current_stock: number;
  minimum_stock_level: number;
  unit_of_measure: string;
  is_low_stock: boolean;
  is_active: boolean;
}

export interface InventoryItemDetail extends InventoryItemListItem {
  manufacturer: string;
  unit_cost: number;
  selling_price: number;
  storage_location: string;
  reorder_quantity: number;
  notes: string;
  batches: StockBatch[];
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: number;
  item: number;
  batch: number | null;
  transaction_type: TransactionType;
  quantity: number;
  reason: string;
  performed_by?: number | null;
  performed_by_name: string;
  performed_at: string;
}

export interface Equipment {
  id: number;
  equipment_code: string;
  name: string;
  model_number: string;
  serial_number: string;
  manufacturer: string;
  location: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  status: EquipmentStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceLog {
  id: number;
  equipment: number;
  maintenance_type: MaintenanceType;
  description: string;
  performed_by_staff?: number | null;
  performed_by_staff_name?: string;
  external_technician: string;
  service_date: string;
  next_due_date: string | null;
  cost: number;
  notes: string;
  created_at: string;
}

// Request Payload Types

export interface NewCategoryPayload {
  name: string;
  description?: string;
}

export interface NewInventoryItemPayload {
  name: string;
  category?: number | null;
  brand?: string;
  manufacturer?: string;
  unit_of_measure: string;
  minimum_stock_level?: number;
  reorder_quantity?: number;
  unit_cost?: number;
  selling_price?: number;
  storage_location?: string;
  // Indicates if item is actively available in clinic rotation
  is_active?: boolean;
  notes?: string;
}

export interface NewBatchPayload {
  batch_number: string;
  quantity_received: number;
  expiry_date?: string | null;
  supplier_name?: string;
  supplier_invoice?: string;
  purchase_cost?: number;
  notes?: string;
}

export interface NewTransactionPayload {
  batch?: number | null;
  transaction_type: TransactionType;
  quantity: number;
  reason?: string;
}

export interface NewEquipmentPayload {
  name: string;
  model_number?: string;
  serial_number?: string;
  manufacturer?: string;
  location?: string;
  purchase_date?: string | null;
  warranty_expiry?: string | null;
  status?: EquipmentStatus;
  notes?: string;
}

export interface NewMaintenanceLogPayload {
  maintenance_type: MaintenanceType;
  description: string;
  external_technician?: string;
  service_date: string;
  next_due_date?: string | null;
  cost?: number;
  notes?: string;
}
