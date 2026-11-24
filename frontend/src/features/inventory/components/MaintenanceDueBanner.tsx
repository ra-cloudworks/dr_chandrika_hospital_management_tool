import { useEffect, useState } from "react";
import { getEquipmentDueMaintenance } from "../../../api/inventoryApi";
import type { Equipment } from "../../../types/inventory.types";

interface MaintenanceDueBannerProps {
  refreshTrigger?: number;
}

export function MaintenanceDueBanner({ refreshTrigger }: MaintenanceDueBannerProps) {
  const [dueEquipment, setDueEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEquipmentDueMaintenance()
      .then((res) => setDueEquipment(res.data))
      .catch((err) => console.error("Error fetching due maintenance equipment:", err))
      .finally(() => setLoading(false));
  }, [refreshTrigger]);

  if (loading || dueEquipment.length === 0) return null;

  return (
    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3 text-rose-700 dark:text-rose-300">
        <span className="material-symbols-outlined text-rose-600 font-bold text-[24px]">build_circle</span>
        <div>
          <h4 className="font-semibold text-sm">Equipment Maintenance Due</h4>
          <p className="text-xs text-rose-600/90 dark:text-rose-300/80">
            {dueEquipment.length} piece{dueEquipment.length > 1 ? "s" : ""} of equipment requires calibration or maintenance service.
          </p>
        </div>
      </div>
      <div className="text-xs font-semibold px-2.5 py-1 bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-md">
        {dueEquipment.length} Action Needed
      </div>
    </div>
  );
}
