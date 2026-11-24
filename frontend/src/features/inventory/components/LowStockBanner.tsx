import { useEffect, useState } from "react";
import { getLowStockAlerts } from "../../../api/inventoryApi";
import type { InventoryItemListItem } from "../../../types/inventory.types";

interface LowStockBannerProps {
  onFilterLowStock?: () => void;
  refreshTrigger?: number;
}

export function LowStockBanner({ onFilterLowStock, refreshTrigger }: LowStockBannerProps) {
  const [lowStockItems, setLowStockItems] = useState<InventoryItemListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLowStockAlerts()
      .then((res) => setLowStockItems(res.data))
      .catch((err) => console.error("Error fetching low stock alerts:", err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading || lowStockItems.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
        <span className="material-symbols-outlined text-amber-600 font-bold text-[24px]">warning</span>
        <div>
          <h4 className="font-semibold text-sm">Low Stock Alert</h4>
          <p className="text-xs text-amber-600/90 dark:text-amber-300/80">
            {lowStockItems.length} item{lowStockItems.length > 1 ? "s are" : " is"} at or below minimum stock threshold.
          </p>
        </div>
      </div>
      {onFilterLowStock && (
        <button
          onClick={onFilterLowStock}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1"
        >
          <span>View Items</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      )}
    </div>
  );
}
