// StatusBadge component for rendering color-coded badges per lab order status
import type { LabOrderStatus } from "../../../types/labManagement.types";

interface StatusBadgeProps {
  status: LabOrderStatus;
}

const STATUS_CONFIG: Record<
  LabOrderStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string }
> = {
  draft: {
    label: "Draft",
    bgClass: "bg-gray-100",
    textClass: "text-gray-700",
    borderClass: "border-gray-300",
  },
  sent_to_lab: {
    label: "Sent to Lab",
    bgClass: "bg-blue-100",
    textClass: "text-blue-800",
    borderClass: "border-blue-300",
  },
  in_fabrication: {
    label: "In Fabrication",
    bgClass: "bg-indigo-100",
    textClass: "text-indigo-800",
    borderClass: "border-indigo-300",
  },
  trial_ready: {
    label: "Trial Ready",
    bgClass: "bg-amber-100",
    textClass: "text-amber-800",
    borderClass: "border-amber-300",
  },
  trial_done: {
    label: "Trial Done",
    bgClass: "bg-teal-100",
    textClass: "text-teal-800",
    borderClass: "border-teal-300",
  },
  remake_requested: {
    label: "Remake Requested",
    bgClass: "bg-red-100",
    textClass: "text-red-800 font-semibold",
    borderClass: "border-red-300",
  },
  delivered: {
    label: "Delivered",
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-800",
    borderClass: "border-emerald-300",
  },
  accepted: {
    label: "Accepted",
    bgClass: "bg-emerald-600",
    textClass: "text-white font-bold",
    borderClass: "border-emerald-700",
  },
  rejected: {
    label: "Rejected",
    bgClass: "bg-rose-600",
    textClass: "text-white font-bold",
    borderClass: "border-rose-700",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bgClass: "bg-gray-100",
    textClass: "text-gray-800",
    borderClass: "border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${config.bgClass} ${config.textClass} ${config.borderClass} transition-colors whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {config.label}
    </span>
  );
}
