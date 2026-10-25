import { useState } from 'react';
import { Minus, Plus, Search } from 'lucide-react';
import type {
  AdminInventoryItem,
  CategorySummary,
  WholesaleSupplier,
} from '../../types/admin';
import { formatPrice } from '../../utils/shopLogic';

interface InventoryAndSuppliersPanelProps {
  mode: 'products' | 'wholesale' | 'categories';
  inventory: AdminInventoryItem[];
  categories: CategorySummary[];
  suppliers: WholesaleSupplier[];
  totalListedProducts: number;
  onUpdateStock: (id: string, nextStock: number) => void;
  onAddProduct: (item: Omit<AdminInventoryItem, 'id'>) => void;
  onToggleCategory: (id: string) => void;
}

export function InventoryAndSuppliersPanel({
  mode,
  inventory,
  categories,
  suppliers,
  totalListedProducts,
  onUpdateStock,
  onAddProduct,
  onToggleCategory,
}: InventoryAndSuppliersPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newSkuName, setNewSkuName] = useState('');
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newSkuCategory, setNewSkuCategory] = useState(
    categories[0]?.name || 'Fresh Fish, Meat & Eggs'
  );
  const [newSkuUnit, setNewSkuUnit] = useState('1 kg');
  const [newSkuPrice, setNewSkuPrice] = useState('120');
  const [newSkuStock, setNewSkuStock] = useState('25');
  const [formError, setFormError] = useState('');

  if (mode === 'products') {
    const filtered = inventory.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });

    function handleCreateSku(e: React.FormEvent) {
      e.preventDefault();
      const priceNum = Number(newSkuPrice);
      const stockNum = Number(newSkuStock);
      if (newSkuName.trim().length < 2 || !newSkuCode.trim() || priceNum <= 0 || stockNum < 0) {
        setFormError('Enter product name, SKU code, valid retail price, and opening stock.');
        return;
      }
      setFormError('');
      onAddProduct({
        sku: newSkuCode.trim().toUpperCase(),
        name: newSkuName.trim(),
        category: newSkuCategory,
        unit: newSkuUnit.trim() || '1 pc',
        price: priceNum,
        stock: stockNum,
        reorderLevel: 5,
        supplier: 'Satui Central Warehouse',
      });
      setNewSkuName('');
      setNewSkuCode('');
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Product List &amp; Live Stock Ledger
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
              Active catalog: <strong className="font-mono text-slate-900">{totalListedProducts}</strong> listed products across {categories.length} store departments.
            </p>
          </div>

          <div className="relative">
            <label htmlFor="inv-search" className="sr-only">
              Search SKU or product
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="inv-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter SKU, name, department..."
              className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Live Stock</th>
                  <th className="px-5 py-3">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filtered.map((item) => {
                  const isLow = item.stock <= item.reorderLevel;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.name}
                        <span className="block font-normal text-[11px] text-slate-400">
                          Supplier: {item.supplier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateStock(item.id, Math.max(0, item.stock - 1))
                            }
                            aria-label={`Decrease stock for ${item.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[2.5rem] text-center font-mono font-bold text-slate-900 tabular-nums">
                            {item.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateStock(item.id, item.stock + 1)}
                            aria-label={`Increase stock for ${item.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            isLow ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {isLow
                            ? `Low Stock (Reorder <= ${item.reorderLevel})`
                            : 'Healthy'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Add SKU Form */}
        <form
          onSubmit={handleCreateSku}
          noValidate
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <h3 className="font-display text-sm font-bold text-slate-900">
            Add New Catalog SKU
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label htmlFor="sku-code" className="block text-[11px] font-semibold text-slate-600">
                SKU Code
              </label>
              <input
                id="sku-code"
                type="text"
                value={newSkuCode}
                onChange={(e) => setNewSkuCode(e.target.value)}
                placeholder="SB-VEG-099"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs"
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="sku-name" className="block text-[11px] font-semibold text-slate-600">
                Product Name
              </label>
              <input
                id="sku-name"
                type="text"
                value={newSkuName}
                onChange={(e) => setNewSkuName(e.target.value)}
                placeholder="Fresh Green Chilli (Beldanga)"
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs"
              />
            </div>
            <div>
              <label htmlFor="sku-cat" className="block text-[11px] font-semibold text-slate-600">
                Category
              </label>
              <select
                id="sku-cat"
                value={newSkuCategory}
                onChange={(e) => setNewSkuCategory(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sku-price" className="block text-[11px] font-semibold text-slate-600">
                Price (₹)
              </label>
              <input
                id="sku-price"
                type="number"
                value={newSkuPrice}
                onChange={(e) => setNewSkuPrice(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor="sku-stock" className="block text-[11px] font-semibold text-slate-600">
                  Stock
                </label>
                <input
                  id="sku-stock"
                  type="number"
                  value={newSkuStock}
                  onChange={(e) => setNewSkuStock(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs"
                />
              </div>
              <button
                type="submit"
                className="h-9 rounded-lg bg-emerald-900 px-4 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap cursor-pointer"
              >
                Add SKU
              </button>
            </div>
          </div>
          {formError && (
            <p role="alert" className="text-xs font-medium text-rose-700">
              {formError}
            </p>
          )}
        </form>
      </div>
    );
  }

  if (mode === 'wholesale') {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-base font-bold text-slate-900">
            Wholesale Shop &amp; Partner Companies
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Direct procurement contacts across Satui Ghat, Berhampore Mandi, Cossimbazar, and Jiaganj loom clusters.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="px-5 py-3">Wholesale Company</th>
                  <th className="px-4 py-3">Supply Category</th>
                  <th className="px-4 py-3">Primary Contact</th>
                  <th className="px-4 py-3">Hub Location</th>
                  <th className="px-4 py-3">Settlement Terms</th>
                  <th className="px-5 py-3 text-right">Last Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {sup.companyName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{sup.categoryFocus}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-900">
                        {sup.contactPerson}
                      </span>
                      <span className="block font-mono text-[11px] text-slate-500 tabular-nums">
                        +91 {sup.phone}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{sup.location}</td>
                    <td className="px-4 py-3.5 text-slate-700">{sup.paymentTerms}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-600 whitespace-nowrap">
                      {sup.lastRestockDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Category Management View
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-slate-900">
          Category Management
        </h2>
        <p className="mt-1 text-xs text-slate-500 tabular-nums">
          Control storefront department visibility and SKU distribution ({totalListedProducts} total listed products).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
              <th className="px-5 py-3">Department Name</th>
              <th className="px-4 py-3">URL Slug</th>
              <th className="px-4 py-3 text-right">Listed Products</th>
              <th className="px-4 py-3">Target Margin</th>
              <th className="px-5 py-3 text-right">Visibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3.5 font-semibold text-slate-900">{cat.name}</td>
                <td className="px-4 py-3.5 font-mono text-slate-500">/{cat.slug}</td>
                <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                  {cat.listedCount}
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-600 tabular-nums">
                  {cat.marginTarget}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => onToggleCategory(cat.id)}
                    className={`rounded-lg border px-3 py-1 text-xs font-semibold cursor-pointer ${
                      cat.active
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.active ? 'Visible on Store' : 'Hidden'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
