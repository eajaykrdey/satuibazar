import type { MarketplaceCategory, UserRole } from '../../types/marketplace';

interface MarketplaceFooterProps {
  categories: MarketplaceCategory[];
  onSelectCategory: (categoryName: string) => void;
  onOpenAuthForRole: (role: UserRole, mode?: 'login' | 'register') => void;
}

export function MarketplaceFooter({
  categories,
  onSelectCategory,
  onOpenAuthForRole,
}: MarketplaceFooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Brand Summary */}
          <div className="space-y-3 md:col-span-5">
            <a
              href="#top"
              className="font-display text-xl font-bold tracking-tight text-slate-900"
            >
              Satuibazar
            </a>
            <p className="max-w-sm text-xs leading-relaxed text-slate-500 sm:text-sm">
              Multi-vendor hyperlocal &amp; heritage marketplace uniting Murshidabad handloom artisans, fresh daily produce sellers, mithai makers, and neighborhood electronics stores.
            </p>
            <p className="text-xs text-slate-400">
              Satui Bazar Chowrasta, Berhampore Subdivision, Murshidabad, WB 742405 · Support: +91 80168 41269
            </p>
          </div>

          {/* Primary Departments */}
          <div className="space-y-2.5 md:col-span-4">
            <h3 className="text-xs font-semibold text-slate-900">
              Marketplace Categories
            </h3>
            <ul className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
              {categories.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat.name);
                      document
                        .getElementById('marketplace-catalog')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-left hover:text-slate-900 cursor-pointer"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 3-Tier Access Portals */}
          <div className="space-y-2.5 md:col-span-3">
            <h3 className="text-xs font-semibold text-slate-900">
              Role Portals &amp; Onboarding
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuthForRole('customer', 'login')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Customer Login &amp; Order Tracking
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuthForRole('vendor', 'register')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Register Your Shop (Vendor Onboarding)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuthForRole('vendor', 'login')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  Shop Owner Vendor Hub
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenAuthForRole('admin', 'login')}
                  className="font-semibold text-emerald-900 hover:underline cursor-pointer"
                >
                  Super Admin Governance Console
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Satuibazar Multi-Vendor Marketplace. All rights reserved.</p>
          <p className="font-mono text-[11px] text-slate-500">
            Accepted Payments: COD · UPI · RuPay · Visa · Mastercard
          </p>
        </div>
      </div>
    </footer>
  );
}
