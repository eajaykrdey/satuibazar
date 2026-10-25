import { ArrowRight, Star, Store } from 'lucide-react';
import { HERO_SHOWCASE_ASSET } from '../../data/assetMap';
import type { MarketplaceCategory, VendorShop } from '../../types/marketplace';
import { ProductImage } from '../ProductImage';

interface MarketplaceHeroAndShopsProps {
  categories: MarketplaceCategory[];
  shops: VendorShop[];
  selectedCategory: string;
  selectedShopId: string;
  onSelectCategory: (categoryName: string) => void;
  onSelectShop: (shopId: string) => void;
  onOpenVendorOnboarding: () => void;
}

export function MarketplaceHeroAndShops({
  categories,
  shops,
  selectedCategory,
  selectedShopId,
  onSelectCategory,
  onSelectShop,
  onOpenVendorOnboarding,
}: MarketplaceHeroAndShopsProps) {
  const approvedShops = shops.filter((s) => s.approvalStatus === 'approved');

  function scrollToCatalog() {
    document
      .getElementById('marketplace-catalog')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="space-y-12">
      {/* Split Editorial Hero Banner */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
        <div className="grid grid-cols-1 items-stretch gap-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:grid-cols-12 lg:p-10">
          <div className="flex flex-col justify-between space-y-6 lg:col-span-7">
            <div className="space-y-4">
              <p className="text-xs font-medium text-slate-500">
                Murshidabad Hyperlocal &amp; Heritage Multi-Vendor Marketplace · {approvedShops.length} Active Shops
              </p>

              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.12] [text-wrap:balance]">
                Bengal Handlooms, Morning Farm Groceries &amp; Daily Essentials from Trusted Local Shops
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Shop directly from verified neighborhood vendors across Satui, Jiaganj, and Berhampore—combining GI-tagged silk weaves, curated electronics, pure A2 cow ghee, hot Kolkata Kathi Rolls, and brass Puja essentials in one shop-grouped cart.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onSelectCategory('All');
                    onSelectShop('ALL');
                    scrollToCatalog();
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Explore Marketplace</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={onOpenVendorOnboarding}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Become a Partner Shop
                </button>
              </div>

              {/* Clean Quick-Jump Category Buttons */}
              <div className="pt-1">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Browse across {categories.length} departments:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.name);
                          scrollToCatalog();
                        }}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'border-emerald-900 bg-emerald-900 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ProductImage
              src={HERO_SHOWCASE_ASSET}
              alt="Curated Satuibazar handloom textiles, electronics, and artisanal home essentials"
              containerClassName="aspect-[4/3] lg:aspect-auto lg:h-full min-h-[260px] rounded-xl border border-slate-200/70"
            />
          </div>
        </div>
      </section>

      {/* Shop-Wise Browsing Directory Strip */}
      <section
        id="vendor-shops"
        aria-labelledby="verified-shops-heading"
        className="mx-auto max-w-7xl scroll-mt-28 px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h2
              id="verified-shops-heading"
              className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
            >
              Shop-Wise Browsing
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Filter the marketplace catalog by a specific verified seller or browse all shops together.
            </p>
          </div>

          {selectedShopId !== 'ALL' && (
            <button
              type="button"
              onClick={() => onSelectShop('ALL')}
              className="text-xs font-semibold text-emerald-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Clear shop filter (Show All Shops)
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {approvedShops.map((shop) => {
            const isSelected = selectedShopId === shop.id;
            return (
              <button
                key={shop.id}
                type="button"
                onClick={() => {
                  onSelectShop(isSelected ? 'ALL' : shop.id);
                  scrollToCatalog();
                }}
                aria-pressed={isSelected}
                className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-900 bg-emerald-50/50 ring-1 ring-emerald-900'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-slate-900">
                      <Store className="h-4 w-4 text-emerald-800 shrink-0" aria-hidden="true" />
                      <span>{shop.name}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                      <span>{shop.rating.toFixed(1)}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {shop.primaryCategory} · {shop.pincode}
                  </p>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
                  {shop.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
