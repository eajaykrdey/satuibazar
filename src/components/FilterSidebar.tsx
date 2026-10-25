import { RotateCcw, Star, X } from 'lucide-react';
import type { Category, FilterState, Product } from '../types/shop';
import {
  DEFAULT_FILTERS,
  MAX_CATALOG_PRICE,
  formatPrice,
} from '../utils/shopLogic';

interface FilterSidebarProps {
  filters: FilterState;
  products: Product[];
  onUpdateFilters: (partial: Partial<FilterState>) => void;
  onResetFilters: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const CATEGORIES: Category[] = ['All', 'Electronics', 'Fashion', 'Household'];
const RATING_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'All Ratings' },
  { value: 4.5, label: '4.5 & above' },
  { value: 4.0, label: '4.0 & above' },
  { value: 3.5, label: '3.5 & above' },
];

export function FilterSidebar({
  filters,
  products,
  onUpdateFilters,
  onResetFilters,
  isMobileOpen,
  onCloseMobile,
}: FilterSidebarProps) {
  const hasActiveFilters =
    filters.category !== DEFAULT_FILTERS.category ||
    filters.maxPrice < MAX_CATALOG_PRICE ||
    filters.minRating > 0 ||
    filters.inStockOnly ||
    filters.dealsOnly ||
    filters.searchQuery.trim().length > 0;

  function getCategoryCount(cat: Category): number {
    if (cat === 'All') return products.length;
    return products.filter((p) => p.category === cat).length;
  }

  const filterBody = (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-slate-900">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-2.5 border-t border-slate-200/80 pt-5">
        <h3 className="text-xs font-semibold tracking-wide text-slate-500">
          Category
        </h3>
        <div className="space-y-1" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onUpdateFilters({ category: cat })}
                aria-pressed={isSelected}
                className={`flex h-10 w-full items-center justify-between rounded-lg px-3 text-sm transition-colors duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-900 font-semibold text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{cat === 'All' ? 'All Categories' : cat}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isSelected ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  {getCategoryCount(cat)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-3 border-t border-slate-200/80 pt-5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="price-range-slider"
            className="text-xs font-semibold tracking-wide text-slate-500"
          >
            Max Price
          </label>
          <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {formatPrice(filters.maxPrice)}
          </span>
        </div>
        <input
          id="price-range-slider"
          type="range"
          min={1000}
          max={MAX_CATALOG_PRICE}
          step={250}
          value={filters.maxPrice}
          onChange={(e) => onUpdateFilters({ maxPrice: Number(e.target.value) })}
          className="h-2 w-full cursor-pointer rounded-lg bg-slate-200"
        />
        <div className="flex items-center justify-between font-mono text-xs text-slate-400 tabular-nums">
          <span>₹1,000</span>
          <span>{formatPrice(MAX_CATALOG_PRICE)}</span>
        </div>
      </div>

      {/* Minimum Customer Rating */}
      <div className="space-y-2.5 border-t border-slate-200/80 pt-5">
        <h3 className="text-xs font-semibold tracking-wide text-slate-500">
          Customer Rating
        </h3>
        <div className="space-y-1" role="group" aria-label="Filter by minimum rating">
          {RATING_OPTIONS.map((opt) => {
            const isSelected = filters.minRating === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateFilters({ minRating: opt.value })}
                aria-pressed={isSelected}
                className={`flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm transition-colors duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 font-semibold text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {opt.value > 0 && (
                  <Star
                    className={`h-3.5 w-3.5 ${
                      isSelected
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-amber-500 text-amber-500'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability & Daily Deals Toggles */}
      <div className="space-y-3 border-t border-slate-200/80 pt-5">
        <h3 className="text-xs font-semibold tracking-wide text-slate-500">
          Availability &amp; Offers
        </h3>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg py-1 text-sm text-slate-700 select-none">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onUpdateFilters({ inStockOnly: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-emerald-900 focus:ring-emerald-800"
          />
          <span>In Stock Only</span>
        </label>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg py-1 text-sm text-slate-700 select-none">
          <input
            type="checkbox"
            checked={filters.dealsOnly}
            onChange={(e) => onUpdateFilters({ dealsOnly: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-emerald-900 focus:ring-emerald-800"
          />
          <span>Daily Deals (25%+ Off)</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        aria-label="Product filters"
        className="hidden w-64 shrink-0 lg:block"
      >
        <div className="sticky top-24 rounded-xl border border-slate-200/90 bg-white p-6">
          {filterBody}
        </div>
      </aside>

      {/* Mobile Slide-Over Filter Drawer */}
      {isMobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter products"
          className="fixed inset-0 z-50 flex lg:hidden"
        >
          <div
            className="fixed inset-0 bg-slate-950/50 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full w-full max-w-xs flex-col justify-between overflow-y-auto bg-white p-6 shadow-xl">
            <div>
              <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                <span className="font-display text-lg font-bold text-slate-900">
                  Refine Catalog
                </span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close filters panel"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {filterBody}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={onCloseMobile}
                className="h-11 w-full rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
