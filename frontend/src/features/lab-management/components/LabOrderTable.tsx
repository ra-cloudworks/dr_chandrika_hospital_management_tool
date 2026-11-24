// LabOrderTable component rendering a responsive, filterable table of lab orders
import type { LabOrderListItem } from "../../../types/labManagement.types";
import { StatusBadge } from "./StatusBadge";

interface LabOrderTableProps {
  orders: LabOrderListItem[];
  onSelectOrder: (orderId: number) => void;
  loading?: boolean;
  showPatientColumn?: boolean;
}

const WORK_TYPE_LABELS: Record<string, string> = {
  crown: "Crown",
  bridge: "Bridge",
  denture: "Denture",
  partial_denture: "Partial Denture",
  implant_crown: "Implant Crown",
  orthodontic_appliance: "Ortho Appliance",
  night_guard: "Night Guard",
  retainer: "Retainer",
  veneer: "Veneer",
  inlay_onlay: "Inlay/Onlay",
  custom: "Custom",
};

export function LabOrderTable({
  orders,
  onSelectOrder,
  loading = false,
  showPatientColumn = true,
}: LabOrderTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-secondary">
        <span className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2"></span>
        <p className="text-sm font-medium">Loading lab orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center bg-surface border border-outline-variant rounded-xl p-6">
        <span className="material-symbols-outlined text-4xl text-secondary mb-2">science</span>
        <h3 className="text-base font-semibold text-on-surface">No Lab Orders Found</h3>
        <p className="text-xs text-secondary mt-1">
          No lab orders match the current search filters or patient records.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-outline-variant shadow-sm bg-surface">
      <table className="w-full text-left border-collapse min-w-[750px]">
        <thead>
          <tr className="bg-surface-container-low border-b border-outline-variant text-xs font-semibold text-secondary uppercase tracking-wider">
            <th className="py-3 px-4">Order #</th>
            {showPatientColumn && <th className="py-3 px-4">Patient</th>}
            <th className="py-3 px-4">Work Type</th>
            <th className="py-3 px-4">Material</th>
            <th className="py-3 px-4">Laboratory</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Doctor Acceptance</th>
            <th className="py-3 px-4">Promised Date</th>
            <th className="py-3 px-4">Delivered Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant text-sm">
          {orders.map((order) => {
            const isOverdue =
              order.promised_delivery_date &&
              new Date(order.promised_delivery_date) < new Date() &&
              !["delivered", "accepted", "rejected", "draft"].includes(order.status);

            return (
              <tr
                key={order.id}
                onClick={() => onSelectOrder(order.id)}
                className={`cursor-pointer transition-colors hover:bg-surface-container-low ${
                  isOverdue ? "bg-rose-50/50 hover:bg-rose-100/50" : ""
                }`}
              >
                <td className="py-3.5 px-4 font-bold text-primary font-mono whitespace-nowrap">
                  {order.order_number}
                  {isOverdue && (
                    <span className="ml-2 text-xs font-semibold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                      Overdue
                    </span>
                  )}
                </td>
                {showPatientColumn && (
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-on-surface">{order.patient_name}</div>
                    <div className="text-xs font-mono text-secondary">{order.patient_code}</div>
                  </td>
                )}
                <td className="py-3.5 px-4 text-on-surface whitespace-nowrap">
                  {WORK_TYPE_LABELS[order.work_type] || order.work_type}
                </td>
                <td className="py-3.5 px-4 text-secondary whitespace-nowrap">
                  {order.material || "—"}
                </td>
                <td className="py-3.5 px-4 text-on-surface whitespace-nowrap">
                  {order.lab_name || "Unassigned"}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      order.doctor_acceptance === "accepted"
                        ? "bg-emerald-100 text-emerald-800"
                        : order.doctor_acceptance === "rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.doctor_acceptance.charAt(0).toUpperCase() +
                      order.doctor_acceptance.slice(1)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-secondary font-mono text-xs whitespace-nowrap">
                  {order.promised_delivery_date || "—"}
                </td>
                <td className="py-3.5 px-4 text-secondary font-mono text-xs whitespace-nowrap">
                  {order.actual_delivery_date || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
