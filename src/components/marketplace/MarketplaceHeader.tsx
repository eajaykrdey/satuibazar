import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  LogOut,
  MapPin,
  Search,
  ShoppingBag,
  Store,
  UserCheck,
  X,
} from 'lucide-react';
import { resolveProductImage } from '../../data/assetMap';
import { PINCODE_ZONES } from '../../data/marketplaceSeed';
import type {
  MarketplaceCategory,
  MarketplaceProduct,
  MarketplaceUser,
  VendorShop,
} from '../../types/marketplace';
import { formatInr, getMarketplaceAutocomplete } from '../../utils/marketplaceLogic';

interface MarketplaceHeaderProps {
  activeView: 'storefront' | 'portal';
  onSwitchView: (view: 'storefront' | 'portal') => void;
  categories: MarketplaceCategory[];
  shops: VendorShop[];
  products: MarketplaceProduct[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  onSelectShop: (shopId: string) => void;
  onQuickViewProduct: (product: MarketplaceProduct) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedPincode: string;
  onSelectPincode: (pincode: string) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  currentUser: MarketplaceUser | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export function MarketplaceHeader({
  activeView,
  onSwitchView,
  categories,
  shops,
  products,
  selectedCategory,
  onSelectCategory,
  onSelectShop,
  onQuickViewProduct,
  searchQuery,
  onSearchChange,
  selectedPincode,
  onSelectPincode,
  cartItemCount,
  onOpenCart,
  currentUser,
  onOpenAuthModal,
  onLogout,
}: MarketplaceHeaderProps) {
  const [isCatMenuOpen, setIsCatMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const catMenuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (catMenuRef.current && !catMenuRef.current.contains(e.target as Node)) {
        setIsCatMenuOpen(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const autocomplete = useMemo(
    () => getMarketplaceAutocomplete(searchQuery, products, shops, categories),
    [searchQuery, products, shops, categories]
  );

  const hasSuggestions =
    autocomplete.matchedCategories.length > 0 ||
    autocomplete.matchedShops.length > 0 ||
    autocomplete.matchedProducts.length > 0;

  const portalLabel =
    currentUser?.role === 'admin'
      ? 'Super Admin'
      : currentUser?.role === 'vendor'
      ? 'Vendor Panel'
      : 'My Account';

  const activeZone =
    PINCODE_ZONES.find((z) => z.pincode === selectedPincode) || PINCODE_ZONES[0];

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
      {/* Row 1: Strict 3-Zone Top Bar Contract */}
      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-6 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSwitchView('storefront');
            onSelectCategory('All');
            onSelectShop('ALL');
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Satuibazar
        </a>

        {/* Zone 2: 4–5 Concise Single-Line Navigation Controls */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => {
              onSwitchView('storefront');
              onSelectCategory('All');
              onSelectShop('ALL');
            }}
            className={`transition-colors hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'storefront' && selectedCategory === 'All'
                ? 'font-semibold text-slate-900 underline decoration-emerald-800 decoration-2 underline-offset-8'
                : ''
            }`}
          >
            Marketplace
          </button>

          {/* Dynamic Categories Dropdown */}
          <div ref={catMenuRef} className="relative">
            <button
              type="button"
              aria-expanded={isCatMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsCatMenuOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 transition-colors hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory !== 'All'
                  ? 'font-semibold text-emerald-900'
                  : ''
              }`}
            >
              <span>Categories</span>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            {isCatMenuOpen && (
              <div
                role="menu"
                aria-label="Product categories"
                className="absolute left-0 top-full mt-3 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onSwitchView('storefront');
                    onSelectCategory('All');
                    setIsCatMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-emerald-50 text-emerald-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>All Marketplace Categories</span>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {categories.length}
                  </span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <div className="max-h-80 overflow-y-auto space-y-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSwitchView('storefront');
                        onSelectCategory(cat.name);
                        setIsCatMenuOpen(false);
                        document
                          .getElementById('marketplace-catalog')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`block w-full rounded-lg px-3 py-2 text-left transition-colors cursor-pointer ${
                        selectedCategory === cat.name
                          ? 'bg-emerald-50 text-emerald-950'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs font-semibold">{cat.name}</span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {cat.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a
            href="#vendor-shops"
            onClick={(e) => {
              e.preventDefault();
              onSwitchView('storefront');
              setTimeout(() => {
                document
                  .getElementById('vendor-shops')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }, 30);
            }}
            className="transition-colors hover:text-slate-900 whitespace-nowrap shrink-0"
          >
            Verified Shops
          </a>

          {currentUser ? (
            <button
              type="button"
              onClick={() => onSwitchView(activeView === 'portal' ? 'storefront' : 'portal')}
              className={`transition-colors hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer ${
                activeView === 'portal'
                  ? 'font-semibold text-emerald-900 underline decoration-emerald-800 decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              {portalLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="transition-colors hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sell on Satuibazar
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Account / Cart Action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onSwitchView('portal')}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 sm:gap-2 sm:px-3 cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-800 shrink-0" aria-hidden="true" />
                <span className="max-w-[76px] truncate sm:max-w-[120px]">
                  {currentUser.fullName}
                </span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                aria-label="Sign out of account"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 shrink-0 cursor-pointer"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 sm:px-3.5 cursor-pointer"
            >
              Login / Register
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Open shopping cart with ${cartItemCount} items`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-900 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0 sm:gap-2 sm:px-3.5 cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Cart</span>
            <span
              data-testid="header-cart-badge"
              className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white tabular-nums"
            >
              {cartItemCount}
            </span>
          </button>
        </div>
      </header>

      {/* Storefront Discovery Sub-Toolbar: Location Pincode Selector + Real-Time Autocomplete Search */}
      {activeView === 'storefront' && (
        <div className="border-t border-slate-100 bg-[#FAF9F6]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            {/* Delivery Location / Pincode Selector Widget */}
            <div className="flex min-w-0 items-center gap-2 text-xs text-slate-700 sm:shrink-0">
              <MapPin className="h-3.5 w-3.5 text-emerald-800 shrink-0" aria-hidden="true" />
              <label htmlFor="delivery-pincode-select" className="font-medium text-slate-500 whitespace-nowrap shrink-0">
                Deliver to:
              </label>
              <select
                id="delivery-pincode-select"
                value={selectedPincode}
                onChange={(e) => onSelectPincode(e.target.value)}
                className="h-8 min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-900 focus:border-emerald-800 focus:outline-none sm:flex-initial cursor-pointer"
              >
                {PINCODE_ZONES.map((z) => (
                  <option key={z.pincode} value={z.pincode}>
                    {z.pincode} — {z.areaName}
                  </option>
                ))}
              </select>
              <span className="hidden lg:inline text-[11px] text-slate-500 whitespace-nowrap">
                · {activeZone.etaLabel}
              </span>
            </div>

            {/* Real-Time Search Bar with Item, Shop, and Category Autocomplete */}
            <div ref={searchBoxRef} className="relative flex-1 sm:max-w-md lg:max-w-lg">
              <label htmlFor="marketplace-global-search" className="sr-only">
                Search by item name, shop name, or category
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="marketplace-global-search"
                type="search"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Search items, shops (e.g. Bengal Weaves), or categories..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-800 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search query"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {isSearchFocused && searchQuery.trim().length > 0 && (
                <div
                  role="listbox"
                  aria-label="Search suggestions"
                  className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                >
                  {!hasSuggestions ? (
                    <p className="px-3 py-4 text-center text-xs text-slate-500">
                      No matching items, vendor shops, or categories for &ldquo;{searchQuery.trim()}&rdquo;.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {autocomplete.matchedShops.length > 0 && (
                        <div>
                          <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                            Verified Vendor Shops
                          </p>
                          {autocomplete.matchedShops.map((shop) => (
                            <button
                              key={shop.id}
                              type="button"
                              onClick={() => {
                                onSelectShop(shop.id);
                                onSearchChange('');
                                setIsSearchFocused(false);
                                document
                                  .getElementById('marketplace-catalog')
                                  ?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-slate-50 cursor-pointer"
                            >
                              <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                                <Store className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                                <span>{shop.name}</span>
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {shop.primaryCategory}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {autocomplete.matchedCategories.length > 0 && (
                        <div>
                          <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                            Categories
                          </p>
                          {autocomplete.matchedCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                onSelectCategory(cat.name);
                                onSearchChange('');
                                setIsSearchFocused(false);
                                document
                                  .getElementById('marketplace-catalog')
                                  ?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              <span className="font-semibold text-slate-900">{cat.name}</span>
                              <span className="text-[11px] text-emerald-800">Browse Category</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {autocomplete.matchedProducts.length > 0 && (
                        <div>
                          <p className="px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                            Matching Items
                          </p>
                          {autocomplete.matchedProducts.map((prod) => (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => {
                                onQuickViewProduct(prod);
                                setIsSearchFocused(false);
                              }}
                              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 cursor-pointer"
                            >
                              <img
                                src={resolveProductImage(prod.id, prod.imageUrl)}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="h-9 w-11 rounded object-cover bg-slate-100 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-slate-900">
                                  {prod.title}
                                </p>
                                <p className="truncate text-[11px] text-slate-500">
                                  Sold by: {prod.shopName} · {prod.category}
                                </p>
                              </div>
                              <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                                {formatInr(prod.price)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
