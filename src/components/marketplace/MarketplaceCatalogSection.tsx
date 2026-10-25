import { SlidersHorizontal, X } from 'lucide-react';
import type {
  CartLine,
  MarketplaceCategory,
  MarketplaceProduct,
  SortMode,
  StorefrontFilterState,
  VendorShop,
} from '../../types/marketplace';
import { formatInr } from '../../utils/marketplaceLogic';
import { MarketplaceProductCard } from './MarketplaceProductCard';

interface MarketplaceCatalogSectionProps {
  categories: MarketplaceCategory[];
  shops: VendorShop[];
  filteredProducts: MarketplaceProduct[];
  totalVisibleProducts: number;
  filters: StorefrontFilterState;
  cart: CartLine[];
  isMobileFiltersOpen: boolean;
  onSetMobileFiltersOpen: (open: boolean) => void;
  onUpdateFilters: (partial: Partial<StorefrontFilterState>) => void;
  onResetFilters: () => void;
  onUpdateCartQuantity: (product: MarketplaceProduct, nextQuantity: number) => void;
  onQuickView: (product: MarketplaceProduct) => void;
}

export function MarketplaceCatalogSection({
  categories,
  shops,
  filteredProducts,
  totalVisibleProducts,
  filters,
  cart,
  isMobileFiltersOpen,
  onSetMobileFiltersOpen,
  onUpdateFilters,
  onResetFilters,
  onUpdateCartQuantity,
  onQuickView,
}: MarketplaceCatalogSectionProps) {
  const approvedShops = shops.filter((s) => s.approvalStatus === 'approved');
  const cartQtyMap = new Map(cart.map((c) => [c.productId, c.quantity]));
  const activeShop = approvedShops.find((s) => s.id === filters.shopId);

  const filterControlsContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-slate-900">
          Refine Marketplace
        </h3>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs font-semibold text-emerald-900 hover:underline cursor-pointer"
        >
          Reset All
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold text-slate-700">Department / Category</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onUpdateFilters({ category: 'All' })}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
              filters.category === 'All'
                ? 'bg-emerald-900 font-semibold text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onUpdateFilters({ category: cat.name })}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                filters.category === cat.name
                  ? 'bg-emerald-900 font-semibold text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shop-Wise Filter */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <p className="text-xs font-semibold text-slate-700">Filter by Vendor Shop</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onUpdateFilters({ shopId: 'ALL' })}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
              filters.shopId === 'ALL'
                ? 'bg-slate-900 font-semibold text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>All Verified Shops</span>
          </button>
          {approvedShops.map((shop) => (
            <button
              key={shop.id}
              type="button"
              onClick={() => onUpdateFilters({ shopId: shop.id })}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                filters.shopId === shop.id
                  ? 'bg-slate-900 font-semibold text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className="truncate">{shop.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Maximum Price Range */}
      <div className="space-y-2 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between text-xs tabular-nums">
          <label htmlFor="mp-price-range" className="font-semibold text-slate-700">
            Max Price
          </label>
          <span className="font-mono font-bold text-slate-900">
            {formatInr(filters.maxPrice)}
          </span>
        </div>
        <input
          id="mp-price-range"
          type="range"
          min={150}
          max={10000}
          step={150}
          value={filters.maxPrice}
          onChange={(e) => onUpdateFilters({ maxPrice: Number(e.target.value) })}
          className="w-full cursor-pointer"
        />
      </div>

      {/* In-Stock Toggle */}
      <div className="border-t border-slate-200 pt-4">
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onUpdateFilters({ inStockOnly: e.target.checked })}
            className="h-4 w-4 rounded accent-emerald-900"
          />
          <span>Show In-Stock Items Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <section
      id="marketplace-catalog"
      aria-labelledby="marketplace-catalog-heading"
      className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-12 pb-16 sm:px-6 lg:px-8"
    >
      {/* Toolbar Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h2
            id="marketplace-catalog-heading"
            className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            {activeShop
              ? `${activeShop.name} Storefront`
              : filters.category === 'All'
              ? 'All Marketplace Listings'
              : filters.category}
          </h2>
          <p
            data-testid="marketplace-results-count"
            className="mt-1 text-xs text-slate-500 sm:text-sm tabular-nums"
          >
            Showing {filteredProducts.length} of {totalVisibleProducts} verified items
            {activeShop ? ` sold by ${activeShop.name}` : ''}
            {filters.searchQuery.trim()
              ? ` matching “${filters.searchQuery.trim()}”`
              : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onSetMobileFiltersOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 lg:hidden cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <label
              htmlFor="mp-sort-select"
              className="text-xs font-medium text-slate-500 whitespace-nowrap"
            >
              Sort by
            </label>
            <select
              id="mp-sort-select"
              value={filters.sortBy}
              onChange={(e) =>
                onUpdateFilters({ sortBy: e.target.value as SortMode })
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-emerald-800 focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured &amp; Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="discount-desc">Biggest Savings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Sidebar + 3-Column Product Grid */}
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside
          aria-label="Marketplace filters"
          className="hidden w-64 shrink-0 rounded-xl border border-slate-200 bg-white p-5 lg:block"
        >
          {filterControlsContent}
        </aside>

        {/* Mobile Slide-Over Filters */}
        {isMobileFiltersOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile marketplace filters"
            className="fixed inset-0 z-50 flex bg-slate-950/55 lg:hidden"
            onClick={() => onSetMobileFiltersOpen(false)}
          >
            <div
              className="h-full w-80 max-w-[88vw] overflow-y-auto bg-white p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-display text-sm font-bold text-slate-900">
                  Filter Products
                </span>
                <button
                  type="button"
                  onClick={() => onSetMobileFiltersOpen(false)}
                  aria-label="Close mobile filters"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {filterControlsContent}
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="min-w-0 flex-1">
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <h3 className="font-display text-lg font-bold text-slate-900">
                No matching items found
              </h3>
              <p className="mt-1.5 mx-auto max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                Try clearing the active shop or category filter, raising the maximum price range, or searching another keyword.
              </p>
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-900 px-5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                Reset Marketplace Filters
              </button>
            </div>
          ) : (
            <div
              data-testid="marketplace-product-grid"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filteredProducts.map((product) => (
                <MarketplaceProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={cartQtyMap.get(product.id) || 0}
                  onUpdateCartQuantity={onUpdateCartQuantity}
                  onQuickView={onQuickView}
                  onFilterByShop={(shopId) => onUpdateFilters({ shopId })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
