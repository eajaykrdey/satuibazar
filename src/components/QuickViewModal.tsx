import { useEffect, useState } from 'react';
import { Check, Minus, Plus, ShoppingBag, Star, X, Zap } from 'lucide-react';
import { resolveProductImage } from '../data/assetMap';
import type { Product } from '../types/shop';
import { calculateDiscountPercent, formatPrice } from '../utils/shopLogic';
import { ProductImage } from './ProductImage';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export function QuickViewModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setAddedFeedback(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const discountPercent = calculateDiscountPercent(product.price, product.originalPrice);
  const savingsAmount = Math.max(0, product.originalPrice - product.price);
  const imageSrc = resolveProductImage(product.id, product.image);

  function handleAdd() {
    if (!product || isOutOfStock) return;
    onAddToCart(product, quantity);
    setAddedFeedback(true);
    window.setTimeout(() => setAddedFeedback(false), 1400);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view modal"
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/90 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 items-stretch md:grid-cols-12">
          {/* Left Studio Gallery Column */}
          <div className="bg-[#F2F0EA] md:col-span-6">
            <ProductImage
              src={imageSrc}
              alt={product.title}
              containerClassName="aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-[420px]"
            />
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="flex flex-col justify-between p-6 sm:p-8 md:col-span-6">
            <div className="space-y-4">
              {/* Unboxed Metadata */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{product.sku}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-800 tabular-nums">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>

              <h2
                id="quick-view-title"
                className="font-display text-2xl font-bold leading-tight text-slate-900"
              >
                {product.title}
              </h2>

              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="font-mono text-sm text-slate-400 line-through tabular-nums">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 tabular-nums">
                      Save {formatPrice(savingsAmount)} ({discountPercent}% off)
                    </span>
                  </>
                )}
              </div>

              {/* Explicit Text Stock Status (never hue alone) */}
              <p
                className={`text-xs font-semibold ${
                  isOutOfStock ? 'text-rose-700' : 'text-emerald-800'
                }`}
              >
                {isOutOfStock
                  ? 'Out of Stock — Currently unavailable for dispatch'
                  : `In Stock — ${product.stock} ${
                      product.stock === 1 ? 'unit' : 'units'
                    } ready for dispatch`}
              </p>

              <p className="text-sm leading-relaxed text-slate-600">
                {product.fullDescription}
              </p>

              <ul className="space-y-1.5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-600">
                {product.specs.map((spec) => (
                  <li key={spec} className="flex items-start gap-2">
                    <span aria-hidden="true" className="text-slate-400">
                      •
                    </span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity Selector & Purchase Options */}
            <div className="mt-6 space-y-4 border-t border-slate-200/80 pt-5">
              {!isOutOfStock && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide text-slate-600">
                    Quantity
                  </span>
                  <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      className="inline-flex h-9 w-9 items-center justify-center text-slate-700 hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span
                      data-testid="quickview-quantity"
                      className="min-w-[2.5rem] text-center font-mono text-sm font-semibold text-slate-900 tabular-nums"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      aria-label="Increase quantity"
                      className="inline-flex h-9 w-9 items-center justify-center text-slate-700 hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAdd}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    isOutOfStock
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : addedFeedback
                      ? 'bg-emerald-700 text-white cursor-pointer'
                      : 'bg-emerald-900 text-white hover:bg-emerald-800 cursor-pointer'
                  }`}
                >
                  {addedFeedback ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                      <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onBuyNow(product, quantity)}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 ${
                    isOutOfStock
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                  }`}
                >
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
