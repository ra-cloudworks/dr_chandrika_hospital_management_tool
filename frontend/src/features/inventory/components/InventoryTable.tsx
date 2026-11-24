import { useState, useEffect } from "react";
import { listInventoryItems, listCategories } from "../../../api/inventoryApi";
import type { InventoryItemListItem, ItemCategory } from "../../../types/inventory.types";

interface InventoryTableProps {
  onSelectItem: (item: InventoryItemListItem) => void;
  refreshTrigger?: number;
  initialLowStockFilter?: boolean;
}

export function InventoryTable({ onSelectItem, refreshTrigger, initialLowStockFilter = false }: InventoryTableProps) {
  const [items, setItems] = useState<InventoryItemListItem[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | "">("");
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStockFilter);

  useEffect(() => {
    if (initialLowStockFilter !== undefined) {
      setLowStockOnly(initialLowStockFilter);
    }
  }, [initialLowStockFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [search, selectedCategory, lowStockOnly, refreshTrigger]);

  const fetchCategories = () => {
    listCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  };

  const fetchItems = () => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (search.trim()) params.search = search.trim();
    if (selectedCategory) params.category_id = selectedCategory;
    if (lowStockOnly) params.low_stock = true;

    listInventoryItems(params)
      .then((res) => setItems(res.data))
      .catch((err) => console.error("Error fetching inventory items:", err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[20px]">search</span>
            <input
              type="text"
              placeholder="Search by item name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value === "" ? "" : Number(e.target.value))}
            className="px-3 py-2 text-xs rounded-xl bg-surface border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
            lowStockOnly
              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50"
              : "bg-surface border-outline-variant text-secondary hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>Low Stock Only</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center text-secondary">
          <span className="material-symbols-outlined animate-spin text-primary text-[32px]">sync</span>
          <p className="text-xs mt-2">Loading inventory stock...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-outline-variant rounded-2xl">
          <span className="material-symbols-outlined text-secondary text-[40px]">inventory_2</span>
          <p className="text-sm font-medium text-on-surface mt-2">No inventory items found</p>
          <p className="text-xs text-secondary">Try adjusting your filters or create a new inventory item.</p>
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-secondary border-b border-outline-variant font-medium">
                <tr>
                  <th className="p-3.5">Item Code</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Brand</th>
                  <th className="p-3.5">Current Stock</th>
                  <th className="p-3.5">Min Level</th>
                  <th className="p-3.5">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-on-surface cursor-pointer">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="hover:bg-surface-container-low/70 transition-colors"
                  >
                    <td className="p-3.5 font-mono font-medium">{item.item_code}</td>
                    <td className="p-3.5 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.is_low_stock && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="Low stock alert" />
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-secondary">{item.category_name || "N/A"}</td>
                    <td className="p-3.5 text-secondary">{item.brand || "N/A"}</td>
                    <td className="p-3.5">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-full ${
                          item.is_low_stock
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            : "text-on-surface"
                        }`}
                      >
                        {item.current_stock}
                      </span>
                    </td>
                    <td className="p-3.5 text-secondary">{item.minimum_stock_level}</td>
                    <td className="p-3.5 capitalize text-secondary">{item.unit_of_measure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
