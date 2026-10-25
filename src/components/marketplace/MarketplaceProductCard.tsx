import { Eye, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import { resolveProductImage } from '../../data/assetMap';
import type { MarketplaceProduct } from '../../types/marketplace';
import { computeDiscountPercent, formatInr } from '../../utils/marketplaceLogic';
import { ProductImage } from '../ProductImage';

interface MarketplaceProductCardProps {
  product: MarketplaceProduct;
  quantityInCart: number;
  onUpdateCartQuantity: (product: MarketplaceProduct, nextQuantity: number) => void;
  onQuickView: (product: MarketplaceProduct) => void;
  onFilterByShop: (shopId: string) => void;
}

export function MarketplaceProductCard({
  product,
  quantityInCart,
  onUpdateCartQuantity,
  onQuickView,
  onFilterByShop,
}: MarketplaceProductCardProps) {
  const discountPct = computeDiscountPercent(product.mrp, product.price);
  const outOfStock = product.stock <= 0;
  const resolvedSrc = resolveProductImage(product.id, product.imageUrl);

  return (
    <article
      data-testid="marketplace-product-card"
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* 4:3 High-Resolution Product Image */}
      <div className="relative">
        <button
          type="button"
          onClick={() => onQuickView(product)}
          aria-label={`Quick view ${product.title}`}
          className="block w-full text-left cursor-pointer"
        >
          <ProductImage
            src={resolvedSrc}
            alt={product.title}
            zoomOnHover
            containerClassName="aspect-[4/3] w-full"
          />
        </button>
      </div>

      {/* Contiguous Card Content */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-1.5">
          {/* Unboxed Category & Unit Metadata (Zero-Pill Discipline) */}
          <p className="truncate text-[11px] font-medium text-slate-500">
            {product.category} · {product.unitLabel}
          </p>

          {/* Product Title */}
          <h3 className="font-display text-base font-bold leading-snug text-slate-900">
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="text-left hover:text-emerald-900 cursor-pointer"
            >
              {product.title}
            </button>
          </h3>

          {/* Mandatory Seller Shop Tag Directly Below Title */}
          <p className="text-xs text-slate-600">
            Sold by:{' '}
            <button
              type="button"
              onClick={() => onFilterByShop(product.shopId)}
              className="font-semibold text-emerald-900 hover:underline cursor-pointer"
            >
              {product.shopName}
            </button>
          </p>

          {/* Rating Stars & Stock Availability */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 tabular-nums">
              <Star
                className="h-3.5 w-3.5 fill-amber-400 text-amber-500"
                aria-hidden="true"
              />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-slate-400">({product.reviewCount})</span>
            </span>

            <span
              className={`font-medium tabular-nums ${
                outOfStock
                  ? 'text-rose-700'
                  : product.stock <= 5
                  ? 'text-amber-700'
                  : 'text-emerald-800'
              }`}
            >
              {outOfStock ? 'Out of Stock' : `In Stock · ${product.stock} left`}
            </span>
          </div>
        </div>

        {/* Pricing & Quick Add-to-Cart / Quantity Stepper */}
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-3.5">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="font-display text-lg font-bold text-slate-900">
              {formatInr(product.price)}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-xs text-slate-400 line-through">
                  {formatInr(product.mrp)}
                </span>
                {discountPct > 0 && (
                  <span className="text-xs font-semibold text-emerald-800">
                    · {discountPct}% off
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {outOfStock ? (
              <button
                type="button"
                disabled
                className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-400 cursor-not-allowed"
              >
                Sold Out
              </button>
            ) : quantityInCart > 0 ? (
              <div
                role="group"
                aria-label={`Quantity selector for ${product.title}`}
                className="flex h-10 flex-1 items-center justify-between rounded-lg border border-emerald-900 bg-emerald-50/60 px-2"
              >
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${product.title}`}
                  onClick={() => onUpdateCartQuantity(product, quantityInCart - 1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-950 hover:bg-emerald-200/60 cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="font-mono text-xs font-bold text-emerald-950 tabular-nums">
                  {quantityInCart} in cart
                </span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${product.title}`}
                  disabled={quantityInCart >= product.stock}
                  onClick={() => onUpdateCartQuantity(product, quantityInCart + 1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-emerald-950 hover:bg-emerald-200/60 disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onUpdateCartQuantity(product, 1)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Add to Cart</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onQuickView(product)}
              aria-label={`Inspect details for ${product.title}`}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Quick View</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
