import { ArrowRight, Minus, Plus, ShoppingBag, Store, Trash2, X } from 'lucide-react';
import { resolveProductImage } from '../../data/assetMap';
import type { GroupedCartSummary, MarketplaceProduct } from '../../types/marketplace';
import {
  FREE_DELIVERY_THRESHOLD,
  formatInr,
} from '../../utils/marketplaceLogic';
import { ProductImage } from '../ProductImage';

interface ShopGroupedCartDrawerProps {
  isOpen: boolean;
  summary: GroupedCartSummary;
  onClose: () => void;
  onUpdateQuantity: (product: MarketplaceProduct, nextQuantity: number) => void;
  onProceedToCheckout: () => void;
}

export function ShopGroupedCartDrawer({
  isOpen,
  summary,
  onClose,
  onUpdateQuantity,
  onProceedToCheckout,
}: ShopGroupedCartDrawerProps) {
  if (!isOpen) return null;

  const remainingForFreeDelivery = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD - summary.subtotal
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-cart-drawer-heading"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/55 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-emerald-900" aria-hidden="true" />
            <div>
              <h2
                id="shop-cart-drawer-heading"
                className="font-display text-base font-bold text-slate-900"
              >
                Shop-Grouped Cart
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                {summary.totalItemCount}{' '}
                {summary.totalItemCount === 1 ? 'item' : 'items'} across{' '}
                {summary.distinctShopCount}{' '}
                {summary.distinctShopCount === 1 ? 'vendor shop' : 'vendor shops'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping cart drawer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Free Delivery Progress */}
        {summary.totalItemCount > 0 && (
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs text-slate-700 tabular-nums">
            {remainingForFreeDelivery > 0 ? (
              <span>
                Add <strong className="text-slate-900">{formatInr(remainingForFreeDelivery)}</strong>{' '}
                more to unlock <strong>Free Hyperlocal Delivery</strong>.
              </span>
            ) : (
              <span className="font-semibold text-emerald-800">
                Free Hyperlocal &amp; Marketplace Delivery unlocked on this order.
              </span>
            )}
          </div>
        )}

        {/* Body: Shop-Grouped Item Lists */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {summary.groups.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <ShoppingBag
                className="h-10 w-10 text-slate-300"
                aria-hidden="true"
              />
              <h3 className="mt-3 font-display text-base font-bold text-slate-900">
                Your marketplace cart is empty
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Add handlooms, electronics, morning vegetables, sweets, or Puja items from any verified shop—we automatically group subtotals by seller.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-900 px-5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            summary.groups.map((group) => (
              <section
                key={group.shopId}
                data-testid={`cart-shop-group-${group.shopId}`}
                aria-label={`Items sold by ${group.shopName}`}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden"
              >
                {/* Vendor Group Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-1.5 font-display text-xs font-bold text-slate-900">
                      <Store className="h-3.5 w-3.5 text-emerald-800 shrink-0" aria-hidden="true" />
                      <span className="truncate">Sold by: {group.shopName}</span>
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {group.shopLocation}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap tabular-nums">
                    {group.itemCount} {group.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Shop Line Items */}
                <div className="divide-y divide-slate-100 px-4">
                  {group.items.map(({ product, quantity, lineSubtotal }) => (
                    <div key={product.id} className="flex items-start gap-3 py-3.5">
                      <ProductImage
                        src={resolveProductImage(product.id, product.imageUrl)}
                        alt={product.title}
                        containerClassName="h-16 w-20 rounded-lg border border-slate-200/70 shrink-0"
                      />

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold leading-snug text-slate-900">
                            {product.title}
                          </p>
                          <button
                            type="button"
                            aria-label={`Remove ${product.title} from cart`}
                            onClick={() => onUpdateQuantity(product, 0)}
                            className="text-slate-400 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-500 tabular-nums">
                          {formatInr(product.price)} × {quantity} ({product.unitLabel})
                        </p>

                        <div className="flex items-center justify-between pt-0.5">
                          <div className="inline-flex h-7 items-center rounded-md border border-slate-200 bg-slate-50 px-1">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${product.title}`}
                              onClick={() => onUpdateQuantity(product, quantity - 1)}
                              className="inline-flex h-5 w-5 items-center justify-center text-slate-700 hover:bg-white rounded cursor-pointer"
                            >
                              <Minus className="h-3 w-3" aria-hidden="true" />
                            </button>
                            <span className="w-7 text-center font-mono text-xs font-semibold text-slate-900 tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${product.title}`}
                              disabled={quantity >= product.stock}
                              onClick={() => onUpdateQuantity(product, quantity + 1)}
                              className="inline-flex h-5 w-5 items-center justify-center text-slate-700 hover:bg-white rounded disabled:opacity-40 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>

                          <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                            {formatInr(lineSubtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Per-Vendor Shop Subtotal Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs tabular-nums">
                  <span className="font-medium text-slate-600">
                    {group.shopName} Subtotal
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatInr(group.shopSubtotal)}
                  </span>
                </div>
              </section>
            ))
          )}
        </div>

        {/* Overall Summary & Checkout Trigger */}
        {summary.groups.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 space-y-3">
            <div className="space-y-1.5 text-xs tabular-nums">
              <div className="flex justify-between text-slate-600">
                <span>Combined Vendor Subtotals</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatInr(summary.subtotal)}
                </span>
              </div>
              {summary.totalSavings > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Total MRP Discount Savings</span>
                  <span className="font-mono font-semibold">
                    −{formatInr(summary.totalSavings)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Marketplace Delivery</span>
                <span className="font-mono font-semibold text-slate-900">
                  {summary.deliveryFee === 0 ? 'FREE' : formatInr(summary.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="font-mono">{formatInr(summary.grandTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 cursor-pointer"
            >
              <span>Proceed to Multi-Vendor Checkout</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
