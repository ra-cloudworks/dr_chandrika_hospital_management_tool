// OverdueBanner component displaying a prominent warning banner when lab orders are past due
import { useEffect, useState } from "react";
import { listOverdueOrders } from "../../../api/labManagementApi";
import type { LabOrderListItem } from "../../../types/labManagement.types";

interface OverdueBannerProps {
  onSelectOverdueFilter?: () => void;
}

export function OverdueBanner({ onSelectOverdueFilter }: OverdueBannerProps) {
  const [overdueOrders, setOverdueOrders] = useState<LabOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverdue = () => {
    setLoading(true);
    listOverdueOrders()
      .then((res) => setOverdueOrders(res.data))
      .catch(() => setOverdueOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  if (loading || overdueOrders.length === 0) {
    return null;
  }

  return (
    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-100 rounded-full text-rose-600 flex-shrink-0">
          <span className="material-symbols-outlined text-xl">warning</span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-900">
            {overdueOrders.length} Lab {overdueOrders.length === 1 ? "Order is" : "Orders are"} Past Delivery Date
          </h4>
          <p className="text-xs text-rose-700 mt-0.5">
            Expected delivery dates have passed without recorded delivery. Contact external labs to update status.
          </p>
        </div>
      </div>
      {onSelectOverdueFilter && (
        <button
          onClick={onSelectOverdueFilter}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap self-end sm:self-center"
        >
          View Overdue Orders ({overdueOrders.length})
        </button>
      )}
    </div>
  );
}
