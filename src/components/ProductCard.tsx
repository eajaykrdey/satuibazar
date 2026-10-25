import { Check, Eye, ShoppingBag, Star } from 'lucide-react';
import { resolveProductImage } from '../data/assetMap';
import type { Product } from '../types/shop';
import { calculateDiscountPercent, formatPrice } from '../utils/shopLogic';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  isRecentlyAdded: boolean;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export function ProductCard({
  product,
  isRecentlyAdded,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const discountPercent = calculateDiscountPercent(product.price, product.originalPrice);
  const isOutOfStock = product.stock <= 0;
  const imageSrc = resolveProductImage(product.id, product.image);

  return (
    <article
      data-testid={`product-card-${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300"
    >
      {/* 4:3 Uniform Studio Image Area */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2F0EA]">
        <button
          type="button"
          onClick={() => onQuickView(product)}
          aria-label={`View details for ${product.title}`}
          className="block h-full w-full text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-800 cursor-pointer"
        >
          <ProductImage
            src={imageSrc}
            alt={product.title}
            containerClassName="h-full w-full"
            zoomOnHover
          />
        </button>

        {/* Single subtle corner status text (max 1 tag, never pill badge clusters) */}
        {isOutOfStock ? (
          <span className="pointer-events-none absolute left-3 top-3 rounded bg-slate-900/85 px-2 py-1 text-[11px] font-medium text-white">
            Out of Stock
          </span>
        ) : discountPercent > 0 ? (
          <span className="pointer-events-none absolute left-3 top-3 rounded bg-white/92 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-900 tabular-nums">
            -{discountPercent}%
          </span>
        ) : null}
      </div>

      {/* Contiguous Card Content */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div className="space-y-2">
          {/* Unboxed Metadata with typographic separators */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-medium text-slate-700 tabular-nums">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
              {product.rating.toFixed(1)}
            </span>
            <span className="text-slate-400 tabular-nums">({product.reviewCount})</span>
          </div>

          <h3 className="font-display text-base font-semibold leading-snug text-slate-900">
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="text-left hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer"
            >
              {product.title}
            </button>
          </h3>

          <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
            {product.briefDescription}
          </p>
        </div>

        {/* Aligned Price & Actions Baseline */}
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
          <div className="flex items-baseline gap-2.5">
            <span className="font-mono text-base font-semibold text-slate-900 tabular-nums">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="font-mono text-xs text-slate-400 line-through tabular-nums">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onQuickView(product)}
              aria-label={`Quick View: ${product.title}`}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Quick View</span>
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product)}
              aria-label={
                isOutOfStock
                  ? `${product.title} is out of stock`
                  : `Add to Cart: ${product.title}`
              }
              className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 whitespace-nowrap shrink-0 ${
                isOutOfStock
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : isRecentlyAdded
                  ? 'bg-emerald-700 text-white cursor-pointer'
                  : 'bg-emerald-900 text-white hover:bg-emerald-800 cursor-pointer'
              }`}
            >
              {isRecentlyAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
