import { useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Lock,
  Minus,
  Plus,
  Store,
  Trash2,
  Upload,
} from 'lucide-react';
import { PRODUCT_ASSET_MAP, resolveProductImage } from '../../data/assetMap';
import type {
  MarketplaceCategory,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceUser,
  VendorFulfillmentStatus,
  VendorShop,
} from '../../types/marketplace';
import {
  computeVendorAnalytics,
  formatInr,
  getVendorScopedOrders,
  getVendorScopedProducts,
} from '../../utils/marketplaceLogic';
import { ProductImage } from '../ProductImage';

interface VendorPortalViewProps {
  currentUser: MarketplaceUser;
  vendorShop: VendorShop | undefined;
  categories: MarketplaceCategory[];
  allProducts: MarketplaceProduct[];
  allOrders: MarketplaceOrder[];
  onCreateProduct: (product: MarketplaceProduct) => void;
  onUpdateProduct: (productId: string, partial: Partial<MarketplaceProduct>) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateVendorOrderStatus: (
    orderId: string,
    shopId: string,
    nextStatus: VendorFulfillmentStatus
  ) => void;
  onBackToStorefront: () => void;
}

const VENDOR_STATUS_OPTIONS: VendorFulfillmentStatus[] = [
  'Pending',
  'Accepted',
  'Preparing',
  'Ready for Dispatch',
  'Out for Delivery',
  'Completed',
];

const STUDIO_PRESET_IMAGES: Array<{ label: string; url: string }> = [
  { label: 'Handloom Linen Apparel', url: PRODUCT_ASSET_MAP['mp-linen-shirt'] },
  { label: 'Murshidabad Silk Stole', url: PRODUCT_ASSET_MAP['mp-silk-stole'] },
  { label: 'A2 Cow Ghee & Clay Yogurt', url: PRODUCT_ASSET_MAP['mp-ghee-doi'] },
  { label: 'Fresh Harvest Vegetables', url: PRODUCT_ASSET_MAP['mp-produce-basket'] },
  { label: 'Bengali Sweets Mithai Box', url: PRODUCT_ASSET_MAP['mp-bengali-sweets'] },
  { label: 'Kolkata Kathi Rolls', url: PRODUCT_ASSET_MAP['mp-kathi-roll'] },
  { label: 'Brass Puja Thali Set', url: PRODUCT_ASSET_MAP['mp-puja-thali'] },
  { label: 'Smart LED & Electrical Kit', url: PRODUCT_ASSET_MAP['mp-led-electrical'] },
  { label: 'Studio Wireless Headphones', url: PRODUCT_ASSET_MAP['mp-headphones'] },
  { label: 'Cast-Iron Dutch Oven', url: PRODUCT_ASSET_MAP['mp-dutch-oven'] },
];

export function VendorPortalView({
  currentUser,
  vendorShop,
  categories,
  allProducts,
  allOrders,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateVendorOrderStatus,
  onBackToStorefront,
}: VendorPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'earnings'>(
    'inventory'
  );

  // Add / Edit Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState(
    vendorShop?.primaryCategory || categories[0]?.name || 'Groceries & Fresh Produce'
  );
  const [unitLabel, setUnitLabel] = useState('1 pc');
  const [mrp, setMrp] = useState('599');
  const [price, setPrice] = useState('449');
  const [stock, setStock] = useState('20');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(STUDIO_PRESET_IMAGES[0].url);
  const [formFeedback, setFormFeedback] = useState('');

  // STRICT TIER 2 ISOLATION: Vendor only ever receives their own shop's inventory, sub-orders & analytics
  const ownProducts = getVendorScopedProducts(allProducts, currentUser);
  const ownOrders = getVendorScopedOrders(allOrders, currentUser);
  const analytics = computeVendorAnalytics(allOrders, allProducts, currentUser);

  if (!vendorShop || !currentUser.shopId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-sm text-slate-600">No shop record linked to this vendor account.</p>
      </div>
    );
  }

  function resetProductForm() {
    setEditingProductId(null);
    setTitle('');
    setSku('');
    setUnitLabel('1 pc');
    setMrp('599');
    setPrice('449');
    setStock('20');
    setDescription('');
    setImageUrl(STUDIO_PRESET_IMAGES[0].url);
  }

  function startEditProduct(prod: MarketplaceProduct) {
    setEditingProductId(prod.id);
    setTitle(prod.title);
    setSku(prod.sku);
    setCategory(prod.category);
    setUnitLabel(prod.unitLabel);
    setMrp(String(prod.mrp));
    setPrice(String(prod.price));
    setStock(String(prod.stock));
    setDescription(prod.description);
    setImageUrl(resolveProductImage(prod.id, prod.imageUrl));
    setFormFeedback('');
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    const parsedPrice = Number(price);
    const parsedMrp = Math.max(parsedPrice, Number(mrp) || parsedPrice);
    const parsedStock = Math.max(0, Math.floor(Number(stock) || 0));

    if (title.trim().length < 3 || !(parsedPrice > 0)) {
      setFormFeedback('Enter a product title (min 3 chars) and a valid selling price.');
      return;
    }

    if (editingProductId) {
      onUpdateProduct(editingProductId, {
        title: title.trim(),
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        category,
        unitLabel: unitLabel.trim() || '1 pc',
        mrp: parsedMrp,
        price: parsedPrice,
        stock: parsedStock,
        description:
          description.trim() ||
          `Freshly stocked by ${vendorShop?.name} on Satuibazar.`,
        imageUrl,
      });
      setFormFeedback(`Updated "${title.trim()}" in ${vendorShop?.name} inventory.`);
      resetProductForm();
      return;
    }

    const newProduct: MarketplaceProduct = {
      id: `mp-custom-${Date.now()}`,
      sku: sku.trim() || `VND-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      description:
        description.trim() ||
        `Authentic ${category} offering sold directly by ${vendorShop?.name}.`,
      category,
      shopId: vendorShop!.id,
      shopName: vendorShop!.name,
      mrp: parsedMrp,
      price: parsedPrice,
      unitLabel: unitLabel.trim() || '1 pc',
      rating: 4.8,
      reviewCount: 1,
      stock: parsedStock,
      imageUrl,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onCreateProduct(newProduct);
    setFormFeedback(`Added "${newProduct.title}" to ${vendorShop?.name} catalog.`);
    resetProductForm();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Vendor Isolated Workspace Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
            <span>Tier 2 · Strict Shop Owner Isolation · Scoped to {vendorShop.name}</span>
            <span>·</span>
            <span
              className={`font-semibold ${
                vendorShop.approvalStatus === 'approved'
                  ? 'text-emerald-800'
                  : vendorShop.approvalStatus === 'pending'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              Status:{' '}
              {vendorShop.approvalStatus === 'approved'
                ? 'Approved (Live on Storefront)'
                : vendorShop.approvalStatus === 'pending'
                ? 'Pending Super Admin Approval'
                : 'Suspended by Super Admin'}
            </span>
          </div>

          <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Store className="h-6 w-6 text-emerald-900" aria-hidden="true" />
            <span>{vendorShop.name} — Vendor Hub</span>
          </h1>
          <p className="text-xs text-slate-500">
            Owner: {vendorShop.contactPerson} · {vendorShop.address} ({vendorShop.pincode}) · Commission Tier: {vendorShop.commissionRatePct}%
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Vendor dashboard sections"
            className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inventory'}
              onClick={() => setActiveTab('inventory')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inventory CRUD ({ownProducts.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shop Orders ({ownOrders.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'earnings'}
              onClick={() => setActiveTab('earnings')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeTab === 'earnings'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Earnings &amp; Payouts
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToStorefront}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Storefront</span>
          </button>
        </div>
      </div>

      {vendorShop.approvalStatus !== 'approved' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-xs text-amber-950">
          <strong>Storefront Visibility Notice:</strong> Your shop is currently{' '}
          <strong>{vendorShop.approvalStatus.toUpperCase()}</strong>. You can prepare your product inventory below, and your items will appear on the public Satuibazar storefront as soon as the Super Admin approves your shop.
        </div>
      )}

      {/* Vendor KPI Strip */}
      <section aria-label="Shop performance metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Shop Gross Sales</p>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {formatInr(analytics.grossSales)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Across {analytics.totalShopOrders} shop sub-orders
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Net Vendor Earnings</p>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-900 tabular-nums">
            {formatInr(analytics.netEarningsTotal)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Pending Payout: <strong>{formatInr(analytics.pendingPayoutAmount)}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Active Fulfillment Queue</p>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {analytics.activePendingOrders}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            Orders awaiting dispatch or delivery
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Listed Shop SKUs</p>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {analytics.totalProducts}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Low Stock (≤5 units): <strong>{analytics.lowStockProducts}</strong>
          </p>
        </div>
      </section>

      {/* TAB 1: PRODUCT INVENTORY CRUD */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Create / Edit Item Form */}
          <form
            onSubmit={handleSaveProduct}
            noValidate
            className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5 lg:col-span-4 h-fit"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                {editingProductId ? 'Edit Shop Item' : 'Add New Shop Item'}
              </h2>
              {editingProductId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {formFeedback && (
              <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
                {formFeedback}
              </p>
            )}

            <div>
              <label htmlFor="vnd-prod-title" className="block text-xs font-semibold text-slate-700">
                Item Title
              </label>
              <input
                id="vnd-prod-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Organic Gobindobhog Rice (2kg)"
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="vnd-prod-cat" className="block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  id="vnd-prod-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="vnd-prod-unit" className="block text-xs font-semibold text-slate-700">
                  Pack / Unit
                </label>
                <input
                  id="vnd-prod-unit"
                  type="text"
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  placeholder="2 kg Pack"
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="vnd-prod-mrp" className="block text-xs font-semibold text-slate-700">
                  MRP (₹)
                </label>
                <input
                  id="vnd-prod-mrp"
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 font-mono text-xs"
                />
              </div>
              <div>
                <label htmlFor="vnd-prod-price" className="block text-xs font-semibold text-slate-700">
                  Sale Price (₹)
                </label>
                <input
                  id="vnd-prod-price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 font-mono text-xs"
                />
              </div>
              <div>
                <label htmlFor="vnd-prod-stock" className="block text-xs font-semibold text-slate-700">
                  Stock Qty
                </label>
                <input
                  id="vnd-prod-stock"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-2.5 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="vnd-prod-img-preset" className="block text-xs font-semibold text-slate-700">
                Product Photography (Studio Preset or Upload)
              </label>
              <select
                id="vnd-prod-img-preset"
                value={
                  STUDIO_PRESET_IMAGES.some((p) => p.url === imageUrl)
                    ? imageUrl
                    : '__custom__'
                }
                onChange={(e) => {
                  if (e.target.value !== '__custom__') {
                    setImageUrl(e.target.value);
                  }
                }}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
              >
                {STUDIO_PRESET_IMAGES.map((preset) => (
                  <option key={preset.label} value={preset.url}>
                    {preset.label}
                  </option>
                ))}
                <option value="__custom__">Uploaded Custom Image</option>
              </select>

              <label className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline cursor-pointer">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Upload Local Product Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
            </div>

            <div>
              <label htmlFor="vnd-prod-desc" className="block text-xs font-semibold text-slate-700">
                Description
              </label>
              <textarea
                id="vnd-prod-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Highlight origin, material, freshness, or warranty..."
                className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs"
              />
            </div>

            <button
              type="submit"
              className="h-10 w-full rounded-lg bg-emerald-900 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
            >
              {editingProductId ? 'Save Product Updates' : 'Publish Item to Shop'}
            </button>
          </form>

          {/* Shop Inventory Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-8">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                {vendorShop.name} Product Catalog
              </h2>
              <p className="text-xs text-slate-500">
                Strictly isolated to items sold by {vendorShop.name}. Other shops&apos; catalogs are inaccessible.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="px-5 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">MRP / Price</th>
                    <th className="px-4 py-3 text-center">Live Stock</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {ownProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                        No products listed in {vendorShop.name} yet. Use the form on the left to add your first item.
                      </td>
                    </tr>
                  ) : (
                    ownProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <ProductImage
                              src={resolveProductImage(prod.id, prod.imageUrl)}
                              alt={prod.title}
                              containerClassName="h-11 w-14 rounded-md border border-slate-200 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-slate-900">{prod.title}</p>
                              <p className="font-mono text-[11px] text-slate-400">
                                {prod.sku} · {prod.unitLabel}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{prod.category}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <span className="font-bold text-slate-900">
                            {formatInr(prod.price)}
                          </span>
                          <span className="block text-[11px] text-slate-400 line-through">
                            {formatInr(prod.mrp)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Decrease stock for ${prod.title}`}
                              onClick={() =>
                                onUpdateProduct(prod.id, {
                                  stock: Math.max(0, prod.stock - 1),
                                })
                              }
                              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
                            >
                              <Minus className="h-3 w-3" aria-hidden="true" />
                            </button>
                            <span className="w-8 text-center font-mono font-bold text-slate-900 tabular-nums">
                              {prod.stock}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase stock for ${prod.title}`}
                              onClick={() =>
                                onUpdateProduct(prod.id, { stock: prod.stock + 1 })
                              }
                              className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={`Edit ${prod.title}`}
                              onClick={() => startEditProduct(prod)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${prod.title}`}
                              onClick={() => onDeleteProduct(prod.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR ISOLATED ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              {vendorShop.name} Incoming Sub-Orders
            </h2>
            <p className="text-xs text-slate-500">
              Strict vendor privacy: displays ONLY items purchased from {vendorShop.name} and your shop&apos;s net payout.
            </p>
          </div>

          {ownOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-xs text-slate-500">
              No customer orders have been placed for {vendorShop.name} yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {ownOrders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="flex flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {ord.orderId}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-800">
                        {ord.customerName} (+91 {ord.customerPhone})
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">
                        {ord.deliveryLocality} ({ord.deliveryPincode})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Slot: {ord.deliverySlotLabel} · Payment: {ord.paymentMethod.toUpperCase()}
                    </p>
                    <ul className="pt-1 space-y-1 text-xs text-slate-700 tabular-nums">
                      {ord.items.map((item) => (
                        <li key={item.productId}>
                          • {item.title} × <strong>{item.quantity}</strong> ({formatInr(item.lineSubtotal)})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 tabular-nums">
                    <div className="text-right text-xs">
                      <p className="text-slate-500">
                        Shop Gross: <strong className="text-slate-900">{formatInr(ord.shopSubtotal)}</strong>
                      </p>
                      <p className="text-emerald-900 font-semibold">
                        Your Net Payout: {formatInr(ord.vendorNetEarnings)}
                      </p>
                    </div>

                    <div>
                      <label htmlFor={`vnd-ord-status-${ord.orderId}`} className="sr-only">
                        Update shop fulfillment status for {ord.orderId}
                      </label>
                      <select
                        id={`vnd-ord-status-${ord.orderId}`}
                        value={ord.vendorStatus}
                        onChange={(e) =>
                          onUpdateVendorOrderStatus(
                            ord.orderId,
                            vendorShop.id,
                            e.target.value as VendorFulfillmentStatus
                          )
                        }
                        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-emerald-800 focus:outline-none cursor-pointer"
                      >
                        {VENDOR_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st === 'Accepted' ? 'Accept Order' : st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EARNINGS & PAYOUT ANALYTICS */}
      {activeTab === 'earnings' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Sales &amp; Settlement Ledger ({vendorShop.name})
            </h2>
            <div className="divide-y divide-slate-100 text-xs tabular-nums">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">Gross Merchandise Value (Shop Items)</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatInr(analytics.grossSales)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">
                  Marketplace Commission ({vendorShop.commissionRatePct}%)
                </span>
                <span className="font-mono text-slate-600">
                  −{formatInr(analytics.grossSales - analytics.netEarningsTotal)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">Settled &amp; Completed Payouts</span>
                <span className="font-mono font-semibold text-emerald-800">
                  {formatInr(analytics.settledPayoutAmount)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">Pending Payouts (In-Transit Orders)</span>
                <span className="font-mono font-semibold text-amber-700">
                  {formatInr(analytics.pendingPayoutAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-3 text-sm font-bold text-slate-900">
                <span>Total Net Shop Earnings</span>
                <span className="font-mono">{formatInr(analytics.netEarningsTotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 text-xs">
            <h2 className="font-display text-base font-bold text-slate-900">
              Registered Payout Bank Account
            </h2>
            <p className="text-slate-500">
              Completed order settlements disburse automatically every Tuesday &amp; Friday.
            </p>
            <div className="space-y-2 border-t border-slate-100 pt-3 text-slate-700">
              <p>
                Beneficiary: <strong className="text-slate-900">{vendorShop.bankDetails.accountHolder}</strong>
              </p>
              <p className="font-mono">
                Account: <strong>{vendorShop.bankDetails.accountNumberMasked}</strong>
              </p>
              <p className="font-mono">
                IFSC Code: <strong>{vendorShop.bankDetails.ifscCode}</strong>
              </p>
              <p className="font-mono">
                UPI Handle: <strong>{vendorShop.bankDetails.upiPayoutId}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
