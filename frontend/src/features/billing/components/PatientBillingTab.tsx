import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { listInvoices, getPatientAccount } from "../../../api/billingApi";
import type { InvoiceListItem, PatientAccount } from "../../../types/billing.types";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceDetailModal } from "./InvoiceDetailModal";
import { NewInvoiceForm } from "./NewInvoiceForm";
import { RecordPaymentModal } from "./RecordPaymentModal";

interface PatientBillingTabProps {
  patientId: number;
  patientName: string;
}

export function PatientBillingTab({ patientId, patientName }: PatientBillingTabProps) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [account, setAccount] = useState<PatientAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  const role = user?.role || "";
  const isPatientRole = role === "patient";
  const canCreate = ["chief_doctor", "doctor", "receptionist", "accountant"].includes(role);
  const canRecordPayment = ["chief_doctor", "receptionist", "accountant"].includes(role);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, accRes] = await Promise.all([
        listInvoices(patientId),
        getPatientAccount(patientId),
      ]);
      setInvoices(invRes.data || []);
      setAccount(accRes.data || null);
    } catch (err) {
      console.error("Failed to load patient billing data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const formatCurrency = (val: number | string | undefined) => {
    if (val === undefined || val === null) return "₹0.00";
    const num = Number(val);
    return isNaN(num)
      ? "₹0.00"
      : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Account Balance Summary Card */}
      {account && (
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
            <div>
              <h3 className="text-base font-bold text-on-surface">Financial Summary & Account Balance</h3>
              <p className="text-xs text-secondary mt-0.5">
                Overview of patient's total billing, payments, and prepaid advances.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isPatientRole && canRecordPayment && (
                <button
                  onClick={() => setShowAdvanceModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">payments</span>
                  <span>Collect Advance</span>
                </button>
              )}
              {!isPatientRole && canCreate && (
                <button
                  onClick={() => setShowNewInvoice(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-on-primary rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">receipt</span>
                  <span>New Invoice</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
              <span className="text-[11px] font-semibold text-secondary uppercase block mb-0.5">
                Prepaid Advance Credit
              </span>
              <span className="text-lg font-bold text-emerald-600 block">
                {formatCurrency(account.credit_balance)}
              </span>
              <span className="text-[10px] text-secondary mt-0.5 block">Available balance</span>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
              <span className="text-[11px] font-semibold text-secondary uppercase block mb-0.5">
                Total Invoiced
              </span>
              <span className="text-lg font-bold text-primary block">
                {formatCurrency(account.total_invoiced)}
              </span>
              <span className="text-[10px] text-secondary mt-0.5 block">Across all bills</span>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
              <span className="text-[11px] font-semibold text-secondary uppercase block mb-0.5">
                Total Paid
              </span>
              <span className="text-lg font-bold text-emerald-700 block">
                {formatCurrency(account.total_paid)}
              </span>
              <span className="text-[10px] text-secondary mt-0.5 block">Cleared payments</span>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant">
              <span className="text-[11px] font-semibold text-secondary uppercase block mb-0.5">
                Outstanding Balance
              </span>
              <span className="text-lg font-bold text-red-600 block">
                {formatCurrency(account.total_outstanding)}
              </span>
              <span className="text-[10px] text-secondary mt-0.5 block">Pending payment</span>
            </div>
          </div>
        </div>
      )}

      {/* Patient Invoices Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
            <h4 className="text-sm font-bold text-on-surface">Patient Billing History</h4>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">
              {invoices.length}
            </span>
          </div>
        </div>

        <InvoiceTable
          invoices={invoices}
          onSelectInvoice={(id) => setSelectedInvoiceId(id)}
          loading={loading}
          showPatientColumn={false}
        />
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoiceId !== null && (
        <InvoiceDetailModal
          invoiceId={selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
          onUpdated={loadData}
        />
      )}

      {/* New Invoice Form Modal */}
      {showNewInvoice && (
        <NewInvoiceForm
          patientId={patientId}
          patientName={patientName}
          onClose={() => setShowNewInvoice(false)}
          onCreated={(newInv) => {
            loadData();
            setSelectedInvoiceId(newInv.id);
          }}
        />
      )}

      {/* Collect Advance Prepayment Modal */}
      {showAdvanceModal && (
        <RecordPaymentModal
          patientId={patientId}
          patientName={patientName}
          mode="advance"
          onClose={() => setShowAdvanceModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

