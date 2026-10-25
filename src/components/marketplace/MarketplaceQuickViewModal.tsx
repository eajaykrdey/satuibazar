import { useEffect, useState } from 'react';
import { MapPin, Minus, Plus, ShoppingBag, Star, Store, X } from 'lucide-react';
import { resolveProductImage } from '../../data/assetMap';
import type { MarketplaceProduct, VendorShop } from '../../types/marketplace';
import { computeDiscountPercent, formatInr } from '../../utils/marketplaceLogic';
import { ProductImage } from '../ProductImage';

interface MarketplaceQuickViewModalProps {
  product: MarketplaceProduct | null;
  vendorShop: VendorShop | undefined;
  quantityInCart: number;
  onClose: () => void;
  onUpdateCartQuantity: (product: MarketplaceProduct, nextQuantity: number) => void;
  onFilterByShop: (shopId: string) => void;
}

export function MarketplaceQuickViewModal({
  product,
  vendorShop,
  quantityInCart,
  onClose,
  onUpdateCartQuantity,
  onFilterByShop,
}: MarketplaceQuickViewModalProps) {
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedQty(quantityInCart > 0 ? quantityInCart : 1);
    }
  }, [product, quantityInCart]);

  if (!product) return null;

  const discountPct = computeDiscountPercent(product.mrp, product.price);
  const outOfStock = product.stock <= 0;
  const resolvedSrc = resolveProductImage(product.id, product.imageUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view modal"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="md:col-span-6">
            <ProductImage
              src={resolvedSrc}
              alt={product.title}
              containerClassName="aspect-[4/3] w-full rounded-xl border border-slate-200/80"
            />
          </div>

          <div className="flex flex-col justify-between space-y-5 md:col-span-6">
            <div className="space-y-3">
              <p className="text-xs font-medium text-slate-500">
                {product.category} · SKU {product.sku}
              </p>

              <h2
                id="quickview-modal-title"
                className="font-display text-xl font-bold text-slate-900 sm:text-2xl"
              >
                {product.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" />
                  <span>{product.rating.toFixed(1)}</span>
                </span>
                <span>({product.reviewCount} verified reviews)</span>
                <span>·</span>
                <span className={outOfStock ? 'font-semibold text-rose-700' : 'font-semibold text-emerald-800'}>
                  {outOfStock ? 'Out of Stock' : `In Stock (${product.stock} available)`}
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 pt-1 tabular-nums">
                <span className="font-display text-2xl font-bold text-slate-900">
                  {formatInr(product.price)}
                </span>
                {product.mrp > product.price && (
                  <>
                    <span className="text-sm text-slate-400 line-through">
                      {formatInr(product.mrp)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800">
                      Save {discountPct}%
                    </span>
                  </>
                )}
                <span className="text-xs text-slate-500">/ {product.unitLabel}</span>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">
                {product.description}
              </p>

              {/* Vendor Background Block */}
              <div className="border-t border-slate-200 pt-3.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                    <Store className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                    <span>Sold by: {product.shopName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onFilterByShop(product.shopId);
                      onClose();
                    }}
                    className="font-semibold text-emerald-900 hover:underline cursor-pointer"
                  >
                    Visit Shop
                  </button>
                </div>
                {vendorShop && (
                  <>
                    <p className="text-slate-600">{vendorShop.description}</p>
                    <p className="inline-flex items-center gap-1 text-slate-500">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      <span>
                        {vendorShop.address} ({vendorShop.pincode})
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Purchase Module */}
            {!outOfStock && (
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                <div className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-slate-50 px-1.5">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-white cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-9 text-center font-mono text-xs font-bold text-slate-900 tabular-nums">
                    {selectedQty}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={selectedQty >= product.stock}
                    onClick={() =>
                      setSelectedQty((q) => Math.min(product.stock, q + 1))
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateCartQuantity(product, selectedQty);
                    onClose();
                  }}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {quantityInCart > 0 ? 'Update Cart Quantity' : 'Add to Shop-Grouped Cart'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
