import { useEffect } from 'react';
import { ArrowRight, Minus, Plus, ReceiptText, ShoppingBag, Trash2, X } from 'lucide-react';
import { resolveProductImage } from '../data/assetMap';
import type { OrderRecord, OrderTotals } from '../types/shop';
import { formatPrice } from '../utils/shopLogic';
import { ProductImage } from './ProductImage';

interface CartDrawerProps {
  isOpen: boolean;
  totals: OrderTotals;
  recentOrder: OrderRecord | null;
  onClose: () => void;
  onUpdateQuantity: (productId: string, nextQuantity: number, maxStock: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  onViewRecentOrder: (order: OrderRecord) => void;
}

export function CartDrawer({
  isOpen,
  totals,
  recentOrder,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onViewRecentOrder,
}: CartDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progressRatio = Math.min(
    100,
    Math.round((totals.subtotal / totals.freeShippingThreshold) * 100)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-emerald-900" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Shopping Cart
            </h2>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              ({totals.itemCount})
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free Shipping Progress Strip */}
        {totals.items.length > 0 && (
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-3">
            <p className="text-xs font-medium text-slate-700 tabular-nums">
              {totals.freeShippingRemaining > 0
                ? `Add ${formatPrice(totals.freeShippingRemaining)} more to unlock Free Standard Delivery.`
                : 'Unlocked Free Standard Delivery on this order.'}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-800 transition-all duration-200"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          </div>
        )}

        {/* Cart Items Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {totals.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <ShoppingBag className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                Your cart is empty
              </h3>
              <p className="mt-1.5 max-w-xs text-sm text-slate-500">
                Browse curated electronics, Bengal handloom apparel, and everyday household pieces.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-emerald-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 cursor-pointer"
              >
                Continue Shopping
              </button>

              {recentOrder && (
                <button
                  type="button"
                  onClick={() => onViewRecentOrder(recentOrder)}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-900 hover:underline cursor-pointer"
                >
                  <ReceiptText className="h-4 w-4" aria-hidden="true" />
                  <span>View Receipt for {recentOrder.orderId}</span>
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-200/80">
              {totals.items.map(({ product, quantity, lineSubtotal }) => {
                const imgSrc = resolveProductImage(product.id, product.image);
                return (
                  <li key={product.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <ProductImage
                      src={imgSrc}
                      alt={product.title}
                      containerClassName="h-20 w-20 shrink-0 rounded-lg border border-slate-200/80"
                    />

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900">
                            {product.title}
                          </h3>
                          <p className="mt-0.5 font-mono text-xs text-slate-500 tabular-nums">
                            {formatPrice(product.price)} each
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(product.id)}
                          aria-label={`Remove ${product.title} from cart`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(product.id, quantity - 1, product.stock)
                            }
                            aria-label={`Decrease quantity of ${product.title}`}
                            className="inline-flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span
                            data-testid={`cart-qty-${product.id}`}
                            className="min-w-[2rem] text-center font-mono text-xs font-semibold text-slate-900 tabular-nums"
                          >
                            {quantity}
                          </span>
                          <button
                            type="button"
                            disabled={quantity >= product.stock}
                            onClick={() =>
                              onUpdateQuantity(product.id, quantity + 1, product.stock)
                            }
                            aria-label={`Increase quantity of ${product.title}`}
                            className="inline-flex h-8 w-8 items-center justify-center text-slate-700 hover:bg-slate-200/60 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                          {formatPrice(lineSubtotal)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Drawer Footer Totals & Checkout Action */}
        {totals.items.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-5 space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <dt>Order Subtotal</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {formatPrice(totals.subtotal)}
                </dd>
              </div>

              {totals.totalSavings > 0 && (
                <div className="flex items-center justify-between text-emerald-800">
                  <dt>Product Discount Savings</dt>
                  <dd className="font-mono font-medium tabular-nums">
                    -{formatPrice(totals.totalSavings)}
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <dt>Estimated Shipping</dt>
                <dd className="font-mono font-medium text-slate-900 tabular-nums">
                  {totals.shippingCost === 0 ? 'Free' : formatPrice(totals.shippingCost)}
                </dd>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-900">
                <dt>Estimated Total</dt>
                <dd
                  data-testid="cart-total-amount"
                  className="font-mono text-lg text-slate-900 tabular-nums"
                >
                  {formatPrice(totals.total)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={onProceedToCheckout}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
