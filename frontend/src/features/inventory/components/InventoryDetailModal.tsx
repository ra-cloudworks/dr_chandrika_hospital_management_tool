import { useState, useEffect } from "react";
import { getInventoryItem, listTransactions } from "../../../api/inventoryApi";
import type { InventoryItemDetail, StockBatch, StockTransaction } from "../../../types/inventory.types";
import { ReceiveStockForm } from "./ReceiveStockForm";
import { ConsumeStockForm } from "./ConsumeStockForm";

interface InventoryDetailModalProps {
  itemId: number;
  onClose: () => void;
  onItemUpdated: () => void;
}

export function InventoryDetailModal({ itemId, onClose, onItemUpdated }: InventoryDetailModalProps) {
  const [item, setItem] = useState<InventoryItemDetail | null>(null);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"batches" | "transactions">("batches");
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [showConsumeForm, setShowConsumeForm] = useState(false);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  useEffect(() => {
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const [itemRes, transRes] = await Promise.all([
        getInventoryItem(itemId),
        listTransactions(itemId),
      ]);
      setItem(itemRes.data);
      setTransactions(transRes.data);
    } catch (err) {
      console.error("Error loading item detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockReceived = (newBatch: StockBatch) => {
    setShowReceiveForm(false);
    fetchItemDetails();
    onItemUpdated();
    setAlertBanner(`Received batch ${newBatch.batch_number} successfully.`);
  };

  const handleTransactionCreated = (st: StockTransaction, lowStockWarning?: boolean) => {
    setShowConsumeForm(false);
    fetchItemDetails();
    onItemUpdated();
    const actionLabel = st.transaction_type;
    const qtyLabel = Math.abs(st.quantity);
    if (lowStockWarning) {
      setAlertBanner(`⚠️ Warning: Stock for this item is now below minimum threshold! (${actionLabel}: ${qtyLabel})`);
    } else {
      setAlertBanner(`Transaction (${actionLabel}: ${qtyLabel}) recorded successfully.`);
    }
  };

  if (loading || !item) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-surface rounded-2xl p-8 flex items-center gap-3 text-on-surface">
          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
          <span>Loading inventory details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              item.is_low_stock ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
            }`}>
              <span className="material-symbols-outlined text-[28px]">inventory_2</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                  {item.item_code}
                </span>
                {item.is_low_stock && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    Low Stock
                  </span>
                )}
                {item.category_name && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-secondary-container/30 text-secondary">
                    {item.category_name}
                  </span>
                )}
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-1">{item.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {alertBanner && (
          <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs flex items-center justify-between">
            <span>{alertBanner}</span>
            <button onClick={() => setAlertBanner(null)} className="hover:opacity-75">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Overview Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant text-xs">
          <div>
            <span className="text-secondary block font-medium">Current Stock</span>
            <span className={`text-base font-bold ${item.is_low_stock ? "text-amber-600" : "text-on-surface"}`}>
              {item.current_stock} {item.unit_of_measure}
            </span>
          </div>
          <div>
            <span className="text-secondary block font-medium">Min Threshold</span>
            <span className="text-base font-bold text-on-surface">{item.minimum_stock_level} {item.unit_of_measure}</span>
          </div>
          <div>
            <span className="text-secondary block font-medium">Reorder Quantity</span>
            <span className="text-base font-bold text-on-surface">{item.reorder_quantity} {item.unit_of_measure}</span>
          </div>
          <div>
            <span className="text-secondary block font-medium">Unit Cost</span>
            <span className="text-base font-bold text-on-surface">₹{item.unit_cost}</span>
          </div>
          <div>
            <span className="text-secondary block font-medium">Storage Location</span>
            <span className="text-base font-semibold text-on-surface">{item.storage_location || "N/A"}</span>
          </div>
        </div>

        {/* Sub-tabs & Actions */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-2">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveSubTab("batches")}
              className={`pb-2 font-medium text-xs border-b-2 transition-colors flex items-center gap-1 ${
                activeSubTab === "batches"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-secondary hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">view_in_ar</span>
              Stock Batches ({item.batches.length})
            </button>
            <button
              onClick={() => setActiveSubTab("transactions")}
              className={`pb-2 font-medium text-xs border-b-2 transition-colors flex items-center gap-1 ${
                activeSubTab === "transactions"
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-secondary hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              Transaction History ({transactions.length})
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowConsumeForm(true);
                setShowReceiveForm(false);
              }}
              className="px-3 py-1.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">remove_circle_outline</span>
              Consume / Adjust
            </button>
            <button
              onClick={() => {
                setShowReceiveForm(true);
                setShowConsumeForm(false);
              }}
              className="px-3 py-1.5 bg-primary text-on-primary hover:opacity-90 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Receive Stock
            </button>
          </div>
        </div>

        {/* Inline Forms */}
        {showReceiveForm && (
          <ReceiveStockForm
            itemId={item.id}
            itemName={item.name}
            onSuccess={handleStockReceived}
            onCancel={() => setShowReceiveForm(false)}
          />
        )}

        {showConsumeForm && (
          <ConsumeStockForm
            itemId={item.id}
            itemName={item.name}
            currentStock={item.current_stock}
            batches={item.batches}
            onSuccess={handleTransactionCreated}
            onCancel={() => setShowConsumeForm(false)}
          />
        )}

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeSubTab === "batches" ? (
            item.batches.length === 0 ? (
              <div className="p-8 text-center text-secondary border border-dashed border-outline-variant rounded-xl">
                <p className="text-xs">No stock batches recorded yet. Click "Receive Stock" to record initial inventory delivery.</p>
              </div>
            ) : (
              <div className="border border-outline-variant rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-secondary border-b border-outline-variant font-medium">
                    <tr>
                      <th className="p-3">Batch Number</th>
                      <th className="p-3">Remaining</th>
                      <th className="p-3">Received</th>
                      <th className="p-3">Expiry Date</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60 text-on-surface">
                    {item.batches.map((b) => (
                      <tr key={b.id} className="hover:bg-surface-container-low/50">
                        <td className="p-3 font-mono font-medium">{b.batch_number}</td>
                        <td className="p-3 font-semibold">{b.quantity_remaining}</td>
                        <td className="p-3 text-secondary">{b.quantity_received}</td>
                        <td className="p-3">
                          {b.expiry_date ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                b.is_expired
                                  ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold"
                                  : b.expires_soon
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                  : "text-on-surface"
                              }`}
                            >
                              {b.expiry_date}
                              {b.is_expired ? " (Expired)" : b.expires_soon ? " (Expires Soon)" : ""}
                            </span>
                          ) : (
                            <span className="text-secondary">N/A</span>
                          )}
                        </td>
                        <td className="p-3 text-secondary">{b.supplier_name || "N/A"}</td>
                        <td className="p-3">{b.purchase_cost ? `₹${b.purchase_cost}` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-secondary border border-dashed border-outline-variant rounded-xl">
              <p className="text-xs">No stock transactions logged yet.</p>
            </div>
          ) : (
            <div className="border border-outline-variant rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low text-secondary border-b border-outline-variant font-medium">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Reason / Details</th>
                    <th className="p-3">Logged By</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 text-on-surface">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-container-low/50">
                      <td className="p-3 capitalize font-medium">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            t.transaction_type === "received"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : t.transaction_type === "consumed"
                              ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                              : t.transaction_type === "disposed"
                              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                              : "bg-slate-500/20 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className={`p-3 font-semibold ${t.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                      </td>
                      <td className="p-3 text-on-surface-variant">{t.reason || "-"}</td>
                      <td className="p-3 text-secondary">{t.performed_by_name || "System"}</td>
                      <td className="p-3 text-secondary font-mono">{new Date(t.performed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
