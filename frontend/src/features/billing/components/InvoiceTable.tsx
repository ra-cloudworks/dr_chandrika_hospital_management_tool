import type { InvoiceListItem } from "../../../types/billing.types";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
  onSelectInvoice: (invoiceId: number) => void;
  loading?: boolean;
  showPatientColumn?: boolean;
}

export function InvoiceTable({
  invoices,
  onSelectInvoice,
  loading = false,
  showPatientColumn = true,
}: InvoiceTableProps) {
  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    return isNaN(num)
      ? "₹0.00"
      : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-secondary">
        <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></span>
        <p className="text-sm font-medium">Loading invoices...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="py-12 text-center bg-surface border border-outline-variant rounded-xl p-6">
        <span className="material-symbols-outlined text-4xl text-secondary mb-2">receipt_long</span>
        <h3 className="text-base font-semibold text-on-surface">No Invoices Found</h3>
        <p className="text-xs text-secondary mt-1">
          No billing records match the current view.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-outline-variant shadow-sm bg-surface">
      <table className="w-full text-left border-collapse min-w-[750px]">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-secondary uppercase tracking-wider">
            <th className="py-3 px-4">Invoice #</th>
            {showPatientColumn && <th className="py-3 px-4">Patient</th>}
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Grand Total</th>
            <th className="py-3 px-4 text-right">Paid</th>
            <th className="py-3 px-4 text-right">Balance Due</th>
            <th className="py-3 px-4">Issue Date</th>
            <th className="py-3 px-4">Due Date</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant text-xs">
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              onClick={() => onSelectInvoice(inv.id)}
              className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
            >
              <td className="py-3 px-4 font-bold text-primary">
                {inv.invoice_number}
              </td>
              {showPatientColumn && (
                <td className="py-3 px-4 font-medium text-on-surface">
                  {inv.patient_name || `Patient #${inv.patient}`}
                </td>
              )}
              <td className="py-3 px-4">
                <InvoiceStatusBadge status={inv.status} />
              </td>
              <td className="py-3 px-4 text-right font-semibold text-on-surface">
                {formatCurrency(inv.grand_total)}
              </td>
              <td className="py-3 px-4 text-right font-medium text-emerald-600">
                {formatCurrency(inv.amount_paid)}
              </td>
              <td className="py-3 px-4 text-right font-bold text-red-600">
                {formatCurrency(inv.balance_due)}
              </td>
              <td className="py-3 px-4 text-secondary">
                {inv.issue_date || "—"}
              </td>
              <td className="py-3 px-4 text-secondary">
                {inv.due_date || "—"}
              </td>
              <td className="py-3 px-4 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectInvoice(inv.id);
                  }}
                  className="px-3 py-1 bg-surface-container hover:bg-surface-container-high text-primary font-semibold rounded-md border border-outline-variant text-xs"
                >
                  View Bill
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

