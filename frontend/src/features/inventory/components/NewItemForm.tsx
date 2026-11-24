import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { createInventoryItem, listCategories, createCategory } from "../../../api/inventoryApi";
import type { ItemCategory, InventoryItemDetail } from "../../../types/inventory.types";

interface NewItemFormProps {
  onSuccess: (item: InventoryItemDetail) => void;
  onCancel: () => void;
}

export function NewItemForm({ onSuccess, onCancel }: NewItemFormProps) {
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [brand, setBrand] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("box");
  const [minimumStockLevel, setMinimumStockLevel] = useState<number | "">(5);
  const [reorderQuantity, setReorderQuantity] = useState<number | "">(20);
  const [unitCost, setUnitCost] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [storageLocation, setStorageLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Inline Category creation
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    listCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await createCategory({ name: newCatName.trim() });
      setCategories((prev) => [...prev, res.data]);
      setCategoryId(res.data.id);
      setNewCatName("");
      setShowNewCatInput(false);
    } catch (err: any) {
      alert(err.response?.data?.name?.[0] || "Failed to create category");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!unitOfMeasure.trim()) {
      setError("Unit of measure is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await createInventoryItem({
        name: name.trim(),
        category: categoryId ? Number(categoryId) : null,
        brand: brand.trim(),
        manufacturer: manufacturer.trim(),
        unit_of_measure: unitOfMeasure.trim(),
        minimum_stock_level: minimumStockLevel ? Number(minimumStockLevel) : 0,
        reorder_quantity: reorderQuantity ? Number(reorderQuantity) : 0,
        unit_cost: unitCost ? Number(unitCost) : 0,
        selling_price: sellingPrice ? Number(sellingPrice) : 0,
        storage_location: storageLocation.trim(),
        // New items are active by default upon registration
        is_active: true,
        notes: notes.trim(),
      });
      onSuccess(res.data);
    } catch (err: any) {
      console.error("Error creating inventory item:", err);
      // Extract specific field errors or detail messages returned by Django REST Framework
      const data = err.response?.data;
      let errMsg = "Failed to create inventory item.";
      if (typeof data === "string") {
        errMsg = data;
      } else if (data?.error || data?.detail) {
        errMsg = data.error || data.detail;
      } else if (data && typeof data === "object") {
        errMsg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Add New Inventory Item</h3>
              <p className="text-xs text-secondary">Register consumable dental supply or material</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-error-container/20 text-error text-xs rounded-xl border border-error/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Filtek Z350 XT Composite Syringe"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-on-surface-variant">Category</label>
                <button
                  type="button"
                  onClick={() => setShowNewCatInput(!showNewCatInput)}
                  className="text-primary text-[11px] font-medium hover:underline"
                >
                  {showNewCatInput ? "Cancel" : "+ New Category"}
                </button>
              </div>

              {showNewCatInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-3 py-1 bg-primary text-on-primary text-xs rounded-lg font-medium"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Unit of Measure *
              </label>
              <input
                type="text"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                placeholder="e.g. box, pack, syringe, ml, unit"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. 3M, Dentsply, Septodont"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. 3M ESPE"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Min Stock Level (Alert Threshold)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minimumStockLevel}
                onChange={(e) => setMinimumStockLevel(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Suggested Reorder Quantity
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={reorderQuantity}
                onChange={(e) => setReorderQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Unit Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Purchase cost per unit"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Selling Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Patient charge per unit"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Storage Location</label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Cabinet B, Shelf 2"
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Notes / Special Instructions</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-secondary hover:bg-surface-container-high rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary text-on-primary font-medium text-xs rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Create Inventory Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
