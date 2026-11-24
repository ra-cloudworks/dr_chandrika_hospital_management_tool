import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import type { InventoryItemListItem, Equipment } from "../../types/inventory.types";
import { LowStockBanner } from "./components/LowStockBanner";
import { ExpiryBanner } from "./components/ExpiryBanner";
import { MaintenanceDueBanner } from "./components/MaintenanceDueBanner";
import { InventoryTable } from "./components/InventoryTable";
import { EquipmentTable } from "./components/EquipmentTable";
import { InventoryDetailModal } from "./components/InventoryDetailModal";
import { EquipmentDetailModal } from "./components/EquipmentDetailModal";
import { NewItemForm } from "./components/NewItemForm";
import { NewEquipmentForm } from "./components/NewEquipmentForm";

export function InventoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"stock" | "equipment">("stock");

  // Modals & Selected Items
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);

  // Trigger counters for child component refresh
  const [refreshStockTrigger, setRefreshStockTrigger] = useState(0);
  const [refreshEquipmentTrigger, setRefreshEquipmentTrigger] = useState(0);

  // Filter state for low stock trigger from banner
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Role checks
  const canManageStock = user && ["chief_doctor", "assistant"].includes(user.role);
  const canManageEquipment = user && user.role === "chief_doctor";

  const triggerStockRefresh = () => setRefreshStockTrigger((prev) => prev + 1);
  const triggerEquipmentRefresh = () => setRefreshEquipmentTrigger((prev) => prev + 1);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface">Inventory & Equipment</h1>
          <p className="text-xs text-secondary mt-1">
            Track consumable supplies, stock thresholds, batch expiry dates, and clinic equipment maintenance.
          </p>
        </div>

        <div>
          {activeTab === "stock" && canManageStock && (
            <button
              onClick={() => setShowNewItemModal(true)}
              className="px-4 py-2.5 bg-primary text-on-primary font-medium text-xs rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Inventory Item</span>
            </button>
          )}

          {activeTab === "equipment" && canManageEquipment && (
            <button
              onClick={() => setShowNewEquipmentModal(true)}
              className="px-4 py-2.5 bg-primary text-on-primary font-medium text-xs rounded-xl hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Equipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-outline-variant">
        <button
          onClick={() => {
            setActiveTab("stock");
            setFilterLowStock(false);
          }}
          className={`pb-3 px-6 font-label-md text-label-md border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "stock"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-secondary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          <span>Consumable Stock</span>
        </button>

        <button
          onClick={() => setActiveTab("equipment")}
          className={`pb-3 px-6 font-label-md text-label-md border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "equipment"
              ? "border-primary text-primary font-bold"
              : "border-transparent text-secondary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">precision_manufacturing</span>
          <span>Clinic Equipment</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "stock" ? (
        <div className="space-y-6">
          {/* Alert Banners at Top */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LowStockBanner
              refreshTrigger={refreshStockTrigger}
              onFilterLowStock={() => setFilterLowStock(true)}
            />
            <ExpiryBanner refreshTrigger={refreshStockTrigger} />
          </div>

          {/* Stock Table */}
          <InventoryTable
            refreshTrigger={refreshStockTrigger}
            initialLowStockFilter={filterLowStock}
            onSelectItem={(item: InventoryItemListItem) => setSelectedItemId(item.id)}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Equipment Maintenance Banner */}
          <MaintenanceDueBanner refreshTrigger={refreshEquipmentTrigger} />

          {/* Equipment Table */}
          <EquipmentTable
            refreshTrigger={refreshEquipmentTrigger}
            onSelectEquipment={(eq: Equipment) => setSelectedEquipmentId(eq.id)}
          />
        </div>
      )}

      {/* Modals */}
      {selectedItemId && (
        <InventoryDetailModal
          itemId={selectedItemId}
          onClose={() => setSelectedItemId(null)}
          onItemUpdated={triggerStockRefresh}
        />
      )}

      {selectedEquipmentId && (
        <EquipmentDetailModal
          equipmentId={selectedEquipmentId}
          onClose={() => setSelectedEquipmentId(null)}
          onEquipmentUpdated={triggerEquipmentRefresh}
        />
      )}

      {showNewItemModal && (
        <NewItemForm
          onSuccess={() => {
            setShowNewItemModal(false);
            triggerStockRefresh();
          }}
          onCancel={() => setShowNewItemModal(false)}
        />
      )}

      {showNewEquipmentModal && (
        <NewEquipmentForm
          onSuccess={() => {
            setShowNewEquipmentModal(false);
            triggerEquipmentRefresh();
          }}
          onCancel={() => setShowNewEquipmentModal(false)}
        />
      )}
    </div>
  );
}
