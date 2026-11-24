// Standalone LabOrdersPage component for managing lab orders across all patients
import { useEffect, useState } from "react";
import { listGlobalLabOrders } from "../../api/labManagementApi";
import type { LabOrderListItem } from "../../types/labManagement.types";
import { LabOrderTable } from "./components/LabOrderTable";
import { OverdueBanner } from "./components/OverdueBanner";
import { LabSelector } from "./components/LabSelector";
import { LabOrderDetailModal } from "./components/LabOrderDetailModal";

export function LabOrdersPage() {
  const [orders, setOrders] = useState<LabOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [labFilter, setLabFilter] = useState<number | null>(null);
  const [workTypeFilter, setWorkTypeFilter] = useState<string>("");
  const [acceptanceFilter, setAcceptanceFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (statusFilter) params.status = statusFilter;
    if (labFilter) params.lab_id = labFilter;
    if (workTypeFilter) params.work_type = workTypeFilter;
    if (acceptanceFilter) params.doctor_acceptance = acceptanceFilter;

    listGlobalLabOrders(params)
      .then((res) => setOrders(res.data))
      .catch((err) => {
        console.error(err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, labFilter, workTypeFilter, acceptanceFilter]);

  // Client-side text search filter
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.patient_name.toLowerCase().includes(q) ||
      o.patient_code.toLowerCase().includes(q) ||
      (o.material && o.material.toLowerCase().includes(q)) ||
      (o.lab_name && o.lab_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">science</span>
            Laboratory Management
          </h1>
          <p className="text-xs text-secondary mt-1">
            Track prosthetic work, lab fabrications, trial fittings, and quality sign-offs.
          </p>
        </div>
      </div>

      {/* Overdue Orders Alert Banner */}
      <OverdueBanner onSelectOverdueFilter={() => setStatusFilter("")} />

      {/* Filter Toolbar */}
      <div className="bg-surface border border-outline-variant p-4 rounded-xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Text Search */}
          <div className="lg:col-span-2 relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search by Order #, Patient name, Code, Material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-outline-variant rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Lab Selector */}
          <div>
            <LabSelector
              value={labFilter}
              onChange={setLabFilter}
              allowAll={true}
              allLabel="All External Labs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent_to_lab">Sent to Lab</option>
              <option value="in_fabrication">In Fabrication</option>
              <option value="trial_ready">Trial Ready</option>
              <option value="trial_done">Trial Done</option>
              <option value="remake_requested">Remake Requested</option>
              <option value="delivered">Delivered</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Work Type Filter */}
          <div>
            <select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Work Types</option>
              <option value="crown">Crown</option>
              <option value="bridge">Bridge</option>
              <option value="denture">Denture</option>
              <option value="partial_denture">Partial Denture</option>
              <option value="implant_crown">Implant Crown</option>
              <option value="orthodontic_appliance">Ortho Appliance</option>
              <option value="night_guard">Night Guard</option>
              <option value="retainer">Retainer</option>
              <option value="veneer">Veneer</option>
              <option value="inlay_onlay">Inlay/Onlay</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Doctor Acceptance Filter */}
          <div>
            <select
              value={acceptanceFilter}
              onChange={(e) => setAcceptanceFilter(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">All Acceptance</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Data Table */}
      <LabOrderTable
        orders={filteredOrders}
        onSelectOrder={(id) => setSelectedOrderId(id)}
        loading={loading}
        showPatientColumn={true}
      />

      {/* Detail Modal */}
      {selectedOrderId && (
        <LabOrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          onUpdated={fetchOrders}
        />
      )}
    </div>
  );
}
