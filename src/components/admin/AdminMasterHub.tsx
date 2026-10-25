import { useEffect, useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import type {
  AdminInventoryItem,
  AdminOrder,
  AdminOrderStatus,
  AdminSectionId,
  CategorySummary,
  DiscountCoupon,
  MarketRateItem,
  ShopConfiguration,
  WholesaleSupplier,
} from '../../types/admin';
import {
  INITIAL_ADMIN_INVENTORY,
  INITIAL_ADMIN_ORDERS,
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_MARKET_RATES,
  INITIAL_SHOP_CONFIG,
  INITIAL_SUPPLIERS,
  computeAdminKpis,
} from '../../utils/adminLogic';
import { AdminLayout } from './AdminLayout';
import { InventoryAndSuppliersPanel } from './InventoryAndSuppliersPanel';
import { OperationsAndBloggerPanel } from './OperationsAndBloggerPanel';
import { OverviewAndOrdersPanel } from './OverviewAndOrdersPanel';

interface AdminMasterHubProps {
  onReturnToWebsite: () => void;
}

export function AdminMasterHub({ onReturnToWebsite }: AdminMasterHubProps) {
  const [activeSection, setActiveSection] = useState<AdminSectionId>('overview');
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [loginEmail, setLoginEmail] = useState(INITIAL_SHOP_CONFIG.adminEmail);
  const [loginError, setLoginError] = useState('');

  const [orders, setOrders] = useState<AdminOrder[]>(INITIAL_ADMIN_ORDERS);
  const [inventory, setInventory] = useState<AdminInventoryItem[]>(INITIAL_ADMIN_INVENTORY);
  const [categories, setCategories] = useState<CategorySummary[]>(INITIAL_CATEGORIES);
  const [marketRates, setMarketRates] = useState<MarketRateItem[]>(INITIAL_MARKET_RATES);
  const [suppliers, setSuppliers] = useState<WholesaleSupplier[]>(INITIAL_SUPPLIERS);
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(INITIAL_COUPONS);
  const [config, setConfig] = useState<ShopConfiguration>(INITIAL_SHOP_CONFIG);

  // Sync live state from Express backend on mount
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.orders)) setOrders(data.orders);
        if (Array.isArray(data.inventory)) setInventory(data.inventory);
        if (Array.isArray(data.categories)) setCategories(data.categories);
        if (Array.isArray(data.marketRates)) setMarketRates(data.marketRates);
        if (Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
        if (Array.isArray(data.coupons)) setCoupons(data.coupons);
        if (data.config) setConfig(data.config);
      })
      .catch(() => {
        // Deterministic baseline already initialized
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = useMemo(
    () => computeAdminKpis(orders, inventory, categories),
    [orders, inventory, categories]
  );

  async function handleUpdateOrderStatus(orderId: string, nextStatus: AdminOrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: nextStatus } : o))
    );
    try {
      await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // Optimistic state retained
    }
  }

  function handleUpdateStock(id: string, nextStock: number) {
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stock: nextStock } : item))
    );
  }

  function handleAddProduct(newItem: Omit<AdminInventoryItem, 'id'>) {
    setInventory((prev) => [
      {
        ...newItem,
        id: `inv-${Date.now()}`,
      },
      ...prev,
    ]);
  }

  function handleToggleCategory(id: string) {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, active: !cat.active } : cat))
    );
  }

  async function handlePublishMarketRates(updatedRates: MarketRateItem[]) {
    setMarketRates(updatedRates);
    try {
      const res = await fetch('/api/admin/market-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rates: updatedRates }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.marketRates)) {
          setMarketRates(data.marketRates);
        }
      }
    } catch {
      // Local rate update already applied
    }
  }

  function handleToggleCoupon(code: string) {
    setCoupons((prev) =>
      prev.map((c) => (c.code === code ? { ...c, active: !c.active } : c))
    );
  }

  function handleAddCoupon(coupon: DiscountCoupon) {
    setCoupons((prev) => [coupon, ...prev]);
  }

  async function handleUpdateConfig(partial: Partial<ShopConfiguration>) {
    setConfig((prev) => ({ ...prev, ...partial }));
    try {
      await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
    } catch {
      // Optimistic update kept
    }
  }

  function handleRelogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setLoginError('Enter a valid administrator email address.');
      return;
    }
    setConfig((prev) => ({ ...prev, adminEmail: loginEmail.trim() }));
    setLoginError('');
    setIsLoggedOut(false);
  }

  if (isLoggedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-900">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-white p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 font-display text-sm font-bold text-white">
              SB
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900">
                Satuibazar Admin Master Hub
              </h1>
              <p className="text-xs text-slate-500">Session signed out securely</p>
            </div>
          </div>

          <form onSubmit={handleRelogin} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="admin-login-email"
                className="block text-xs font-semibold text-slate-700"
              >
                Admin Email
              </label>
              <input
                id="admin-login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
              {loginError && (
                <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                  {loginError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
              <button
                type="submit"
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign In to Admin Hub</span>
              </button>

              <button
                type="button"
                onClick={onReturnToWebsite}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Return to Main Website
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      config={config}
      pendingCount={kpis.pendingDeliveryQueue}
      lowStockCount={kpis.lowStockAlerts}
      onReturnToWebsite={onReturnToWebsite}
      onLogout={() => setIsLoggedOut(true)}
    >
      {(activeSection === 'overview' || activeSection === 'orders') && (
        <OverviewAndOrdersPanel
          mode={activeSection}
          kpis={kpis}
          orders={orders}
          hotline={config.hotlinePrimary}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onOpenSection={(target) => setActiveSection(target)}
        />
      )}

      {(activeSection === 'products' ||
        activeSection === 'wholesale' ||
        activeSection === 'categories') && (
        <InventoryAndSuppliersPanel
          mode={activeSection}
          inventory={inventory}
          categories={categories}
          suppliers={suppliers}
          totalListedProducts={kpis.totalListedProducts}
          onUpdateStock={handleUpdateStock}
          onAddProduct={handleAddProduct}
          onToggleCategory={handleToggleCategory}
        />
      )}

      {(activeSection === 'market-rates' ||
        activeSection === 'coupons' ||
        activeSection === 'config' ||
        activeSection === 'blogger-xml') && (
        <OperationsAndBloggerPanel
          mode={activeSection}
          marketRates={marketRates}
          coupons={coupons}
          config={config}
          onPublishMarketRates={handlePublishMarketRates}
          onToggleCoupon={handleToggleCoupon}
          onAddCoupon={handleAddCoupon}
          onUpdateConfig={handleUpdateConfig}
        />
      )}
    </AdminLayout>
  );
}
