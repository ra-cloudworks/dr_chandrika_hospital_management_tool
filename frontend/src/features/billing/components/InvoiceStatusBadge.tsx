import type { InvoiceStatus } from "../../../types/billing.types";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; bg: string; text: string; border: string; strike?: boolean }
> = {
  draft: {
    label: "Draft",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-300",
  },
  issued: {
    label: "Issued",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  partially_paid: {
    label: "Partially Paid",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
  paid: {
    label: "Paid",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
  },
  overdue: {
    label: "Overdue",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-300",
  },
  void: {
    label: "Void",
    bg: "bg-gray-200",
    text: "text-gray-500",
    border: "border-gray-400",
    strike: true,
  },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${
        config.strike ? "line-through" : ""
      }`}
    >
      {config.label}
    </span>
  );
}

