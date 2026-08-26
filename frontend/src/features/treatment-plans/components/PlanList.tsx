import { useState } from "react";
import type { TreatmentPlan, PlanStatus } from "../../../types/treatmentPlan.types";

const STATUS_COLORS: Record<PlanStatus, string> = {
    draft: "bg-gray-100 text-gray-700",
    proposed: "bg-amber-100 text-amber-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-500",
};

interface Props {
    plans: TreatmentPlan[];
    onPropose: (planId: number) => void;
    onRevise: (planId: number, reason: string) => void;
}

export function PlanList({ plans, onPropose, onRevise }: Props) {
    const [revisingId, setRevisingId] = useState<number | null>(null);
    const [reason, setReason] = useState("");

    if (plans.length === 0) return <p className="text-gray-500 text-sm">No treatment plans yet.</p>;

    return (
        <div className="space-y-3">
            {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="font-medium">{plan.title} <span className="text-xs text-gray-400">v{plan.revision_number}</span></p>
                            <p className="text-sm text-gray-500">{plan.chief_complaint}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs capitalize ${STATUS_COLORS[plan.status]}`}>
                            {plan.status.replace("_", " ")}
                        </span>
                    </div>

                    <ul className="text-sm mb-2">
                        {plan.items.map((item) => (
                            <li key={item.id} className="flex justify-between border-b py-1">
                                <span>{item.tooth_number} — {item.procedure_name} ({item.phase})</span>
                                <span>₹{item.item_total}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-sm font-medium mb-3">Total: ₹{plan.total_estimated_cost}</p>

                    {plan.status === "draft" && (
                        <button onClick={() => onPropose(plan.id)} className="bg-teal-600 text-white px-3 py-1.5 rounded text-sm">
                            Propose to Patient
                        </button>
                    )}

                    {["proposed", "accepted"].includes(plan.status) && revisingId !== plan.id && (
                        <button onClick={() => setRevisingId(plan.id)} className="border px-3 py-1.5 rounded text-sm">
                            Revise Plan
                        </button>
                    )}

                    {revisingId === plan.id && (
                        <div className="mt-2 flex gap-2">
                            <input placeholder="Reason for change" value={reason} onChange={(e) => setReason(e.target.value)}
                                className="border rounded px-3 py-2 flex-1 text-sm" />
                            <button
                                onClick={() => { onRevise(plan.id, reason); setRevisingId(null); setReason(""); }}
                                className="bg-teal-600 text-white px-3 py-1.5 rounded text-sm"
                            >
                                Confirm
                            </button>
                        </div>
                    )}

                    {plan.consent_signed && (
                        <p className="text-xs text-green-600 mt-2">✓ Patient consented on {plan.consent_signed_at}</p>
                    )}
                </div>
            ))}
        </div>
    );
}