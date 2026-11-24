// PatientLabOrdersTab component for displaying and managing lab orders inside PatientDetailPage
import { useEffect, useState } from "react";
import { listPatientLabOrders } from "../../../api/labManagementApi";
import type { LabOrderListItem } from "../../../types/labManagement.types";
import { LabOrderTable } from "../../lab-management/components/LabOrderTable";
import { NewLabOrderForm } from "../../lab-management/components/NewLabOrderForm";
import { LabOrderDetailModal } from "../../lab-management/components/LabOrderDetailModal";

interface PatientLabOrdersTabProps {
  patientId: number;
}

export function PatientLabOrdersTab({ patientId }: PatientLabOrdersTabProps) {
  const [orders, setOrders] = useState<LabOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchPatientOrders = () => {
    setLoading(true);
    listPatientLabOrders(patientId)
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error(err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientOrders();
    }
  }, [patientId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface border border-outline-variant p-4 rounded-xl shadow-sm">
        <div>
          <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">science</span>
            Patient Lab Orders ({orders.length})
          </h3>
          <p className="text-xs text-secondary mt-0.5">
            View prosthetic fabrication history, shade specifications, and delivery status for this patient.
          </p>
        </div>

        {!showNewForm && (
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-primary text-on-primary hover:bg-primary/90 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-end sm:self-center"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Lab Order
          </button>
        )}
      </div>

      {showNewForm ? (
        <NewLabOrderForm
          patientId={patientId}
          onCreated={() => {
            setShowNewForm(false);
            fetchPatientOrders();
          }}
          onCancel={() => setShowNewForm(false)}
        />
      ) : (
        <LabOrderTable
          orders={orders}
          onSelectOrder={(id) => setSelectedOrderId(id)}
          loading={loading}
          showPatientColumn={false}
        />
      )}

      {selectedOrderId && (
        <LabOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onUpdated={fetchPatientOrders}
        />
      )}
    </div>
  );
}
