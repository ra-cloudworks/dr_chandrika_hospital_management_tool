import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getRevenueReport } from "../../../api/billingApi";
import type { RevenueReport } from "../../../types/billing.types";

export function RevenueSummaryCard() {
  const { user } = useAuth();
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const canViewInternalMargin =
    user?.role === "chief_doctor" || user?.role === "accountant";

  const fetchReport = async () => {
    if (!canViewInternalMargin) return;
    setLoading(true);
    try {
      const res = await getRevenueReport(fromDate, toDate);
      setReport(res.data);
    } catch (err) {
      console.error("Failed to load revenue report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewInternalMargin) {
      fetchReport();
    }
  }, [fromDate, toDate, canViewInternalMargin]);

  if (!canViewInternalMargin) {
    return null;
  }

  const formatCurrency = (val: number | string | undefined) => {
    if (val === undefined || val === null) return "₹0.00";
    const num = Number(val);
    return isNaN(num)
      ? "₹0.00"
      : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
            <h3 className="text-lg font-bold text-on-surface">Financial Governance & Revenue Overview</h3>
          </div>
          <p className="text-xs text-secondary mt-0.5">
            Internal clinic costs and profit margins restricted to Chief Doctor & Accountant roles.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex items-center gap-2 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-secondary mb-0.5">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-secondary mb-0.5">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="mt-3.5 px-2.5 py-1.5 text-xs text-secondary hover:text-on-surface border border-outline-variant rounded-lg"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-secondary">
          <span className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mb-1"></span>
          <p className="text-xs">Computing financial metrics...</p>
        </div>
      ) : report ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
              Total Invoiced
            </span>
            <span className="text-xl font-bold text-primary block">
              {formatCurrency(report.total_revenue)}
            </span>
            <span className="text-[11px] text-secondary mt-1 block">
              {report.invoice_count} {report.invoice_count === 1 ? "invoice" : "invoices"}
            </span>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
              Collected
            </span>
            <span className="text-xl font-bold text-emerald-600 block">
              {formatCurrency(report.total_collected)}
            </span>
            <span className="text-[11px] text-emerald-700 mt-1 block">Cash / UPI / Cards</span>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
              Outstanding Due
            </span>
            <span className="text-xl font-bold text-red-600 block">
              {formatCurrency(report.total_outstanding)}
            </span>
            <span className="text-[11px] text-red-700 mt-1 block">Pending balance</span>
          </div>

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
            <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block mb-1">
              Discounts Given
            </span>
            <span className="text-xl font-bold text-amber-600 block">
              {formatCurrency(report.total_discount_given)}
            </span>
            <span className="text-[11px] text-amber-700 mt-1 block">Approved concessions</span>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Internal Cost
              </span>
              <span className="material-symbols-outlined text-xs text-primary" title="Never shown to patient">
                lock
              </span>
            </div>
            <span className="text-xl font-bold text-on-surface block">
              {formatCurrency(report.total_internal_cost)}
            </span>
            <span className="text-[11px] text-secondary mt-1 block">Lab & material outlay</span>
          </div>

          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Gross Margin
              </span>
              <span className="material-symbols-outlined text-xs text-emerald-700" title="Clinic net profitability">
                trending_up
              </span>
            </div>
            <span className="text-xl font-bold text-emerald-700 block">
              {formatCurrency(report.gross_margin)}
            </span>
            <span className="text-[11px] font-bold text-emerald-800 mt-1 block">
              {report.gross_margin_percent ?? 0}% margin
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

