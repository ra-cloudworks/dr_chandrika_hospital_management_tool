import { useEffect, useState } from "react";
import { getExpiringBatches } from "../../../api/inventoryApi";
import type { StockBatch } from "../../../types/inventory.types";

interface ExpiryBannerProps {
  refreshTrigger?: number;
}

export function ExpiryBanner({ refreshTrigger }: ExpiryBannerProps) {
  const [expiringBatches, setExpiringBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpiringBatches()
      .then((res) => setExpiringBatches(res.data))
      .catch((err) => console.error("Error fetching expiring batches:", err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading || expiringBatches.length === 0) return null;

  return (
    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 text-orange-700 dark:text-orange-300">
        <span className="material-symbols-outlined text-orange-600 font-bold text-[24px]">event_busy</span>
        <div>
          <h4 className="font-semibold text-sm">Expiring Stock Alert</h4>
          <p className="text-xs text-orange-600/90 dark:text-orange-300/80">
            {expiringBatches.length} batch{expiringBatches.length > 1 ? "es are" : " is"} expiring within 30 days.
          </p>
        </div>
      </div>
      <div className="text-xs font-semibold px-2.5 py-1 bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-md">
        {expiringBatches.length} Expiring
      </div>
    </div>
  );
}
