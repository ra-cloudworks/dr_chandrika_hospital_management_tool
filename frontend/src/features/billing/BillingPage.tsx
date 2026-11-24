import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getOutstandingInvoices } from "../../api/billingApi";
import type { InvoiceListItem } from "../../types/billing.types";
import { RevenueSummaryCard } from "./components/RevenueSummaryCard";
import { DiscountApprovalPanel } from "./components/DiscountApprovalPanel";
import { InvoiceTable } from "./components/InvoiceTable";
import { InvoiceDetailModal } from "./components/InvoiceDetailModal";

export function BillingPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("outstanding");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const role = user?.role || "";
  const isChiefDoctor = role === "chief_doctor";

  const loadInvoices = async () => {
    setLoading(true);
    try {
      if (statusFilter === "outstanding") {
        const res = await getOutstandingInvoices();
        setInvoices(res.data || []);
      } else {
        // If specific status or all
        const res = await getOutstandingInvoices();
        let data = res.data || [];
        if (statusFilter) {
          data = data.filter((i) => i.status === statusFilter);
        }
        setInvoices(data);
      }
    } catch (err) {
      console.error("Failed to load invoices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(q) ||
      inv.patient_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Billing & Financial Governance</h1>
          <p className="text-xs text-secondary mt-0.5">
            Manage patient invoices, payment collections, Chief Doctor discount sign-offs, and profitability margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadInvoices()}
            className="px-3.5 py-2 text-xs font-semibold bg-surface border border-outline-variant hover:bg-surface-container-high rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Revenue Summary (Role-gated internal margin view) */}
      <RevenueSummaryCard />

      {/* Chief Doctor Approval Queue */}
      {isChiefDoctor && (
        <DiscountApprovalPanel onRequestResolved={loadInvoices} />
      )}

      {/* Invoices List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">receipt</span>
            <h3 className="text-base font-bold text-on-surface">Outstanding & Active Invoices</h3>
            <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-xs rounded-full">
              {filteredInvoices.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-secondary text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Search invoice or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="outstanding">All Outstanding (Due &gt; 0)</option>
              <option value="issued">Issued</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Invoices Data Table */}
        <InvoiceTable
          invoices={filteredInvoices}
          onSelectInvoice={(id) => setSelectedInvoiceId(id)}
          loading={loading}
          showPatientColumn={true}
        />
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoiceId !== null && (
        <InvoiceDetailModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
          onUpdated={loadInvoices}
        />
      )}
    </div>
  );
}
export default BillingPage;
