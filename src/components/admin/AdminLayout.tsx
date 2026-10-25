import { useState } from 'react';
import {
  ArrowUpRight,
  Code2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react';
import type { AdminSectionId, ShopConfiguration } from '../../types/admin';

interface AdminLayoutProps {
  activeSection: AdminSectionId;
  onSelectSection: (section: AdminSectionId) => void;
  config: ShopConfiguration;
  pendingCount: number;
  lowStockCount: number;
  onReturnToWebsite: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const MENU_ITEMS: Array<{
  id: AdminSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Recent Order Queue', icon: ShoppingBag },
  { id: 'products', label: 'Product List & Stock', icon: Package },
  { id: 'wholesale', label: 'Wholesale Shop & Companies', icon: Truck },
  { id: 'categories', label: 'Category Management', icon: FolderTree },
  { id: 'market-rates', label: "Today's Market Rates", icon: TrendingUp },
  { id: 'coupons', label: 'Coupons & Discount Codes', icon: Tag },
  { id: 'config', label: 'Shop Configuration', icon: Settings },
  { id: 'blogger-xml', label: 'Blogger XML Theme & Code', icon: Code2 },
];

export function AdminLayout({
  activeSection,
  onSelectSection,
  config,
  pendingCount,
  lowStockCount,
  onReturnToWebsite,
  onLogout,
  children,
}: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentSectionLabel =
    MENU_ITEMS.find((m) => m.id === activeSection)?.label || 'Dashboard Overview';

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-950 text-slate-200">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-display text-sm font-bold text-white">
              SB
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-white">
                Satuibazar
              </p>
              <p className="truncate text-xs text-slate-400">Admin Master Hub</p>
            </div>
          </div>

          {mobileOpen && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close admin sidebar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Admin Identity */}
        <div className="border-b border-slate-800/80 px-5 py-3">
          <p className="text-[11px] font-medium text-slate-400">Signed in as</p>
          <p className="truncate font-mono text-xs font-medium text-emerald-300">
            {config.adminEmail}
          </p>
        </div>

        {/* Navigation Menu */}
        <nav aria-label="Admin Master Hub navigation" className="px-3 py-4">
          <ul className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const countValue =
                item.id === 'orders'
                  ? pendingCount
                  : item.id === 'products' && lowStockCount > 0
                  ? lowStockCount
                  : null;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSection(item.id);
                      setMobileOpen(false);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex h-10 w-full items-center justify-between gap-2.5 rounded-lg px-3 text-left text-xs font-medium transition-colors duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {countValue !== null && (
                      <span
                        className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${
                          isActive ? 'text-emerald-50' : 'text-amber-400'
                        }`}
                      >
                        {countValue}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Sidebar Bottom Quick Actions */}
      <div className="space-y-2 border-t border-slate-800 p-4">
        <button
          type="button"
          onClick={onReturnToWebsite}
          className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 whitespace-nowrap cursor-pointer"
        >
          <span>Return to Main Website</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-xs font-medium text-slate-400 transition-colors hover:bg-rose-950/50 hover:text-rose-300 whitespace-nowrap cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation menu"
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-64 max-w-[82vw]">{sidebarContent}</div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Top Bar Contract: Breadcrumb on Left, Live Operational Status + Quick Actions on Right */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:h-16 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open admin menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden font-medium text-slate-500 sm:inline">
                Admin Master Hub
              </span>
              <span aria-hidden="true" className="hidden text-slate-300 sm:inline">
                /
              </span>
              <h1 className="truncate font-display text-base font-bold text-slate-900 sm:text-lg">
                {currentSectionLabel}
              </h1>
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0 sm:gap-5">
            {/* Operational Status Indicators (Unboxed Clean Text with Semantic Labels) */}
            <div
              data-testid="admin-header-status"
              className="hidden items-center gap-2.5 text-xs md:flex"
            >
              <span
                className={`font-semibold ${
                  config.shopOpen ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                Shop Status: {config.shopOpen ? 'Open (LIVE)' : 'Closed'}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span
                className={`font-semibold ${
                  config.onlineOrderingActive ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                Online Ordering: {config.onlineOrderingActive ? 'Active' : 'Paused'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReturnToWebsite}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Return to Main Website</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Operational Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-100/70 px-4 py-2 text-[11px] md:hidden">
          <span
            className={`font-semibold ${
              config.shopOpen ? 'text-emerald-800' : 'text-rose-800'
            }`}
          >
            Shop Status: {config.shopOpen ? 'Open (LIVE)' : 'Closed'}
          </span>
          <span
            className={`font-semibold ${
              config.onlineOrderingActive ? 'text-emerald-800' : 'text-amber-800'
            }`}
          >
            Online Ordering: {config.onlineOrderingActive ? 'Active' : 'Paused'}
          </span>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
