// API service functions for Module 12: Inventory & Equipment Management
import { apiClient } from "./client";
import type {
  ItemCategory,
  InventoryItemListItem,
  InventoryItemDetail,
  StockBatch,
  StockTransaction,
  Equipment,
  MaintenanceLog,
  NewCategoryPayload,
  NewInventoryItemPayload,
  NewBatchPayload,
  NewTransactionPayload,
  NewEquipmentPayload,
  NewMaintenanceLogPayload,
} from "../types/inventory.types";

// Categories API
export const listCategories = () =>
  apiClient.get<ItemCategory[]>("/inventory/categories/");

export const createCategory = (data: NewCategoryPayload) =>
  apiClient.post<ItemCategory>("/inventory/categories/", data);

// Stock Items API
export const listInventoryItems = (params?: Record<string, any>) =>
  apiClient.get<InventoryItemListItem[]>("/inventory/items/", { params });

export const getInventoryItem = (id: number) =>
  apiClient.get<InventoryItemDetail>(`/inventory/items/${id}/`);

export const createInventoryItem = (data: NewInventoryItemPayload) =>
  apiClient.post<InventoryItemDetail>("/inventory/items/", data);

export const updateInventoryItem = (id: number, data: Partial<NewInventoryItemPayload>) =>
  apiClient.patch<InventoryItemDetail>(`/inventory/items/${id}/`, data);

// Stock Batches & Transactions API
export const addStockBatch = (itemId: number, data: NewBatchPayload) =>
  apiClient.post<StockBatch>(`/inventory/items/${itemId}/batches/`, data);

export const listTransactions = (itemId: number) =>
  apiClient.get<StockTransaction[]>(`/inventory/items/${itemId}/transactions/`);

export const createTransaction = (itemId: number, data: NewTransactionPayload) =>
  apiClient.post<StockTransaction & { low_stock_warning?: boolean }>(
    `/inventory/items/${itemId}/transactions/`,
    data
  );

// Alerts API
export const getLowStockAlerts = () =>
  apiClient.get<InventoryItemListItem[]>("/inventory/alerts/low-stock/");

export const getExpiringBatches = () =>
  apiClient.get<StockBatch[]>("/inventory/alerts/expiring/");

// Equipment API
export const listEquipment = () =>
  apiClient.get<Equipment[]>("/inventory/equipment/");

export const getEquipment = (id: number) =>
  apiClient.get<Equipment & { maintenance_logs: MaintenanceLog[] }>(`/inventory/equipment/${id}/`);

export const createEquipment = (data: NewEquipmentPayload) =>
  apiClient.post<Equipment>("/inventory/equipment/", data);

export const updateEquipment = (id: number, data: Partial<NewEquipmentPayload>) =>
  apiClient.patch<Equipment>(`/inventory/equipment/${id}/`, data);

// Equipment Maintenance API
export const listMaintenanceLogs = (equipmentId: number) =>
  apiClient.get<MaintenanceLog[]>(`/inventory/equipment/${equipmentId}/maintenance/`);

export const createMaintenanceLog = (equipmentId: number, data: NewMaintenanceLogPayload) =>
  apiClient.post<MaintenanceLog>(`/inventory/equipment/${equipmentId}/maintenance/`, data);

export const getEquipmentDueMaintenance = () =>
  apiClient.get<Equipment[]>("/inventory/equipment/due-maintenance/");
