import { useEffect, useRef, useState } from 'react';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import type { Category, Product, SearchSuggestion } from '../types/shop';
import { formatPrice, getSearchSuggestions } from '../utils/shopLogic';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  products: Product[];
  cartItemCount: number;
  activeNav: 'home' | 'categories' | 'deals' | 'about' | 'contact';
  onNavigate: (section: 'home' | 'categories' | 'deals' | 'about' | 'contact') => void;
  onSelectCategorySuggestion: (category: Exclude<Category, 'All'>) => void;
  onSelectProductSuggestion: (product: Product) => void;
  onOpenCart: () => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  products,
  cartItemCount,
  activeNav,
  onNavigate,
  onSelectCategorySuggestion,
  onSelectProductSuggestion,
  onOpenCart,
}: HeaderProps) {
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const suggestions: SearchSuggestion[] = getSearchSuggestions(products, searchQuery, 6);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const navItems: Array<{
    id: 'home' | 'categories' | 'deals' | 'about' | 'contact';
    label: string;
    href: string;
  }> = [
    { id: 'home', label: 'Home', href: '#top' },
    { id: 'categories', label: 'Categories', href: '#catalog' },
    { id: 'deals', label: 'Deals', href: '#catalog' },
    { id: 'about', label: 'About', href: '#about' },
    { id: 'contact', label: 'Contact', href: '#contact' },
  ];

  function handleSuggestionPick(suggestion: SearchSuggestion) {
    setIsSuggestionsOpen(false);
    setIsMobileSearchOpen(false);
    if (suggestion.type === 'category' && suggestion.category) {
      onSelectCategorySuggestion(suggestion.category);
    } else {
      const found = products.find((p) => p.id === suggestion.id);
      if (found) {
        onSelectProductSuggestion(found);
      }
    }
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-md md:h-16">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 lg:hidden"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:text-2xl"
          >
            Satuibazar
          </a>
        </div>

        {/* Zone 2: Primary Navigation Links + Global Search */}
        <div className="hidden flex-1 items-center justify-center gap-8 lg:flex">
          <nav aria-label="Main navigation" className="flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.id);
                  }}
                  className={`relative py-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 ${
                    isActive
                      ? 'text-emerald-900 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-emerald-800'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div ref={searchContainerRef} className="relative w-full max-w-sm">
            <label htmlFor="global-product-search" className="sr-only">
              Search products and categories
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="global-product-search"
              type="search"
              value={searchQuery}
              onFocus={() => setIsSuggestionsOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsSuggestionsOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSuggestionsOpen(false);
                }
              }}
              placeholder="Search electronics, handloom, homeware..."
              autoComplete="off"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/90 pl-10 pr-8 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 focus:border-emerald-800 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setIsSuggestionsOpen(false);
                }}
                aria-label="Clear search query"
                className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Auto-Suggestions Dropdown */}
            {isSuggestionsOpen && searchQuery.trim().length > 0 && (
              <div
                role="listbox"
                aria-label="Search suggestions"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
              >
                {suggestions.length > 0 ? (
                  <ul className="divide-y divide-slate-100 py-1">
                    {suggestions.map((suggestion) => (
                      <li key={suggestion.id}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionPick(suggestion)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-slate-50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {suggestion.label}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {suggestion.sublabel}
                            </p>
                          </div>
                          {suggestion.price !== undefined ? (
                            <span className="font-mono text-xs font-semibold text-emerald-900 tabular-nums shrink-0">
                              {formatPrice(suggestion.price)}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-800 shrink-0">
                              Filter
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-xs text-slate-500">
                    No matching products for &ldquo;{searchQuery.trim()}&rdquo;.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Mobile Search Trigger + Primary Shopping Cart Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            aria-label={isMobileSearchOpen ? 'Close search bar' : 'Open search bar'}
            aria-expanded={isMobileSearchOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 lg:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Shopping Cart, ${cartItemCount} ${cartItemCount === 1 ? 'item' : 'items'}`}
            className="inline-flex h-10 items-center gap-2.5 rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span>Cart</span>
            <span
              data-testid="cart-badge"
              className="inline-flex min-w-[1.35rem] items-center justify-center rounded bg-emerald-950/80 px-1.5 py-0.5 font-mono text-xs font-semibold text-emerald-100 tabular-nums"
            >
              {cartItemCount}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Panel */}
      {isMobileSearchOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
          <div className="relative">
            <label htmlFor="mobile-product-search" className="sr-only">
              Search products
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="mobile-product-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search electronics, handloom, homeware..."
              autoFocus
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-9 text-sm text-slate-900 focus:border-emerald-800 focus:bg-white focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear mobile search"
                className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery.trim().length > 0 && suggestions.length > 0 && (
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {suggestions.slice(0, 4).map((suggestion) => (
                <li key={`mob-${suggestion.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionPick(suggestion)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span className="truncate text-sm font-medium text-slate-900">
                      {suggestion.label}
                    </span>
                    {suggestion.price !== undefined && (
                      <span className="font-mono text-xs font-semibold text-emerald-900 tabular-nums shrink-0">
                        {formatPrice(suggestion.price)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Expandable Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={`mob-nav-${item.id}`}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsMobileMenuOpen(false);
                    onNavigate(item.id);
                  }}
                  className={`flex h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                    activeNav === item.id
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
