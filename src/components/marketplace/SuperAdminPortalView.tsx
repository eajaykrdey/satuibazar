import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FolderPlus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
} from 'lucide-react';
import type {
  AuditLogEntry,
  MarketplaceCategory,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceUser,
  VendorApprovalStatus,
  VendorShop,
} from '../../types/marketplace';
import { computeSuperAdminMetrics, formatInr } from '../../utils/marketplaceLogic';

interface SuperAdminPortalViewProps {
  currentUser: MarketplaceUser;
  shops: VendorShop[];
  categories: MarketplaceCategory[];
  products: MarketplaceProduct[];
  orders: MarketplaceOrder[];
  users: MarketplaceUser[];
  auditLogs: AuditLogEntry[];
  onUpdateShopApproval: (shopId: string, status: VendorApprovalStatus) => void;
  onAddCategory: (category: MarketplaceCategory) => void;
  onUpdateCategory: (categoryId: string, partial: Partial<MarketplaceCategory>) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAdminDeleteProduct: (productId: string) => void;
  onResetDemoData: () => void;
  onBackToStorefront: () => void;
}

export function SuperAdminPortalView({
  currentUser,
  shops,
  categories,
  products,
  orders,
  users,
  auditLogs,
  onUpdateShopApproval,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAdminDeleteProduct,
  onResetDemoData,
  onBackToStorefront,
}: SuperAdminPortalViewProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'vendors' | 'categories' | 'audit'
  >('overview');

  // Dynamic Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatFast, setNewCatFast] = useState(false);
  const [catNotice, setCatNotice] = useState('');

  const metrics = computeSuperAdminMetrics(
    orders,
    shops,
    users,
    products,
    auditLogs,
    currentUser
  );

  if (!metrics) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-700" aria-hidden="true" />
        <h1 className="mt-3 font-display text-xl font-bold text-slate-900">
          Unauthorized Access
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Root Super Admin privileges are required to view global platform telemetry.
        </p>
      </div>
    );
  }

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (trimmed.length < 3) {
      setCatNotice('Category name must be at least 3 characters.');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setCatNotice('A category with this name already exists.');
      return;
    }

    const newCategory: MarketplaceCategory = {
      id: `cat-custom-${Date.now()}`,
      name: trimmed,
      slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description:
        newCatDesc.trim() ||
        `Curated ${trimmed} listings across verified Satuibazar partner shops.`,
      isFastDeliveryEligible: newCatFast,
      isSystemDefault: false,
    };

    onAddCategory(newCategory);
    setNewCatName('');
    setNewCatDesc('');
    setNewCatFast(false);
    setCatNotice(`Added dynamic category "${newCategory.name}" across Storefront & Vendor panels.`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Super Admin Root Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
            <span>Tier 3 · Super Admin Root Control · Full Platform Audit Access</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Satuibazar Multi-Vendor Governance Console
          </h1>
          <p className="text-xs text-slate-500">
            Signed in as {currentUser.email} · Auditing {shops.length} shops, {categories.length} categories, and {users.length} user accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Super Admin governance tabs"
            className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-100 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Global Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'vendors'}
              onClick={() => setActiveTab('vendors')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeTab === 'vendors'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vendor Approvals ({metrics.pendingApprovalShops} Pending)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'categories'}
              onClick={() => setActiveTab('categories')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'audit'}
              onClick={() => setActiveTab('audit')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Global Audit &amp; Logs
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

      {/* Global KPI Metrics */}
      <section aria-label="Global marketplace metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Total Platform Sales (GMV)</p>
          <p
            data-testid="admin-total-gmv"
            className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums"
          >
            {formatInr(metrics.totalGmvSales)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Total Orders: <strong>{metrics.totalOrders}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Total Active Shops</p>
          <p
            data-testid="admin-active-shops"
            className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums"
          >
            {metrics.activeApprovedShops}
          </p>
          <p className="mt-1.5 text-xs text-amber-700 tabular-nums">
            Pending Verification: <strong>{metrics.pendingApprovalShops}</strong> · Suspended:{' '}
            <strong>{metrics.suspendedShops}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Total Customers</p>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900 tabular-nums">
            {metrics.totalCustomers}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Listed Catalog SKUs: <strong>{metrics.totalCatalogItems}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold text-slate-500">Platform Commission Revenue</p>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-900 tabular-nums">
            {formatInr(metrics.platformCommissionRevenue)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
            Net marketplace fee earned across vendor splits
          </p>
        </div>
      </section>

      {/* TAB 1: GLOBAL OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-7">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                All Platform Multi-Vendor Orders
              </h2>
              <p className="text-xs text-slate-500">
                Complete cross-shop order ledger visible exclusively to Super Admin.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="px-5 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Shops Involved</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {orders.map((ord) => (
                    <tr key={ord.orderId} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {ord.orderId}
                        <span className="block font-sans text-[11px] font-normal text-slate-400">
                          {ord.createdAt}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{ord.customerName}</p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {ord.deliveryAddress.pincode} · {ord.paymentMethod.toUpperCase()}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {ord.vendorBreakdowns.map((b) => b.shopName).join(', ')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-emerald-900">
                        {ord.overallStatus}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatInr(ord.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 lg:col-span-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                Recent System Activity Audit
              </h2>
              <button
                type="button"
                onClick={onResetDemoData}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Demo Seed</span>
              </button>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="py-2.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono font-semibold text-slate-700">
                      {log.action}
                    </span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="text-slate-700">{log.targetSummary}</p>
                  <p className="text-[11px] text-slate-500">
                    Actor: {log.actorName} ({log.actorRole})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHOP / VENDOR APPROVALS */}
      {activeTab === 'vendors' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Shop / Vendor Approvals &amp; Compliance
            </h2>
            <p className="text-xs text-slate-500">
              Approve pending onboarding applications or suspend shops to immediately hide their listings from the customer storefront.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {shops.map((shop) => {
              const skuCount = products.filter((p) => p.shopId === shop.id).length;
              return (
                <div
                  key={shop.id}
                  className="flex flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Store className="h-4 w-4 text-emerald-800" aria-hidden="true" />
                      <h3 className="font-display text-base font-bold text-slate-900">
                        {shop.name}
                      </h3>
                      <span className="text-xs text-slate-400">·</span>
                      <span
                        className={`text-xs font-semibold ${
                          shop.approvalStatus === 'approved'
                            ? 'text-emerald-800'
                            : shop.approvalStatus === 'pending'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {shop.approvalStatus.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Owner: <strong>{shop.contactPerson}</strong> · {shop.email} · +91 {shop.phone} ·{' '}
                      {shop.address} ({shop.pincode})
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      Primary Category: {shop.primaryCategory} · Listed SKUs: {skuCount} · Payout IFSC:{' '}
                      <span className="font-mono">{shop.bankDetails.ifscCode}</span> ({shop.bankDetails.accountNumberMasked})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {shop.approvalStatus !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => onUpdateShopApproval(shop.id, 'approved')}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Approve Shop</span>
                      </button>
                    )}

                    {shop.approvalStatus !== 'suspended' && (
                      <button
                        type="button"
                        onClick={() => onUpdateShopApproval(shop.id, 'suspended')}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 cursor-pointer"
                      >
                        Suspend Shop
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DYNAMIC CATEGORY MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleCreateCategory}
            noValidate
            className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 lg:col-span-4 h-fit"
          >
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-emerald-900" aria-hidden="true" />
              <span>Add Custom Category</span>
            </h2>
            <p className="text-xs text-slate-500">
              New categories immediately appear in the Customer Storefront navigation and Vendor Inventory forms.
            </p>

            {catNotice && (
              <p
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"
              >
                {catNotice}
              </p>
            )}

            <div>
              <label htmlFor="adm-cat-name" className="block text-xs font-semibold text-slate-700">
                Category Name
              </label>
              <input
                id="adm-cat-name"
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Organic Honey & Tea"
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="adm-cat-desc" className="block text-xs font-semibold text-slate-700">
                Short Description
              </label>
              <input
                id="adm-cat-desc"
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Sundarban raw honey, Darjeeling first-flush teas..."
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-xs text-slate-900"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newCatFast}
                onChange={(e) => setNewCatFast(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-900"
              />
              <span>Eligible for 35-min Hyperlocal Delivery Slot</span>
            </label>

            <button
              type="submit"
              className="h-10 w-full rounded-lg bg-emerald-900 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
            >
              Create Marketplace Category
            </button>
          </form>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-8">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                Active Marketplace Categories ({categories.length})
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.name).length;
                return (
                  <div
                    key={cat.id}
                    className="flex flex-col justify-between gap-3 px-5 py-3.5 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-900">
                        {cat.name}{' '}
                        <span className="font-normal text-slate-400">
                          · {count} {count === 1 ? 'item' : 'items'}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">{cat.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateCategory(cat.id, {
                            isFastDeliveryEligible: !cat.isFastDeliveryEligible,
                          })
                        }
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        {cat.isFastDeliveryEligible
                          ? '35-Min Express: ON'
                          : 'Standard Slot'}
                      </button>

                      {!cat.isSystemDefault && (
                        <button
                          type="button"
                          aria-label={`Delete category ${cat.name}`}
                          onClick={() => onDeleteCategory(cat.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FULL ACCESS AUDIT (USERS, GLOBAL INVENTORY & SYSTEM LOGS) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Global User Directory */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                Registered User &amp; Role Audit ({users.length} Accounts)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="px-5 py-3">Full Name</th>
                    <th className="px-4 py-3">Role Tier</th>
                    <th className="px-4 py-3">Email &amp; Phone</th>
                    <th className="px-4 py-3">Location / Linked Shop</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-3 font-semibold text-slate-900">{u.fullName}</td>
                      <td className="px-4 py-3 font-mono uppercase text-emerald-900 font-semibold">
                        {u.role}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {u.email} · <span className="font-mono">{u.phone}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {u.address} ({u.pincode})
                        {u.shopId ? ` · Shop ID: ${u.shopId}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Global Cross-Vendor Inventory Moderation */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                Cross-Vendor Catalog Audit ({products.length} Total Listings)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="px-5 py-3">SKU &amp; Title</th>
                    <th className="px-4 py-3">Vendor Shop</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Stock</th>
                    <th className="px-5 py-3 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {prod.title}
                        <span className="block font-mono text-[11px] font-normal text-slate-400">
                          {prod.sku}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{prod.shopName}</td>
                      <td className="px-4 py-3 text-slate-600">{prod.category}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                        {formatInr(prod.price)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {prod.stock}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          aria-label={`Remove listing ${prod.title}`}
                          onClick={() => onAdminDeleteProduct(prod.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full System Activity Audit Log */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-display text-base font-bold text-slate-900">
                Complete System Activity Audit Log ({auditLogs.length} Events)
              </h2>
            </div>
            <div className="divide-y divide-slate-100 px-5 py-2 text-xs">
              {auditLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900">
                      {entry.action}
                    </span>{' '}
                    — <span className="text-slate-700">{entry.targetSummary}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 whitespace-nowrap">
                    {entry.actorName} ({entry.actorRole}) · {entry.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
