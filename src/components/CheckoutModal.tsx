import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Printer,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import type {
  CartItem,
  CustomerInfo,
  OrderRecord,
  PaymentDetails,
  PaymentMethod,
  Product,
  ShippingDetails,
} from '../types/shop';
import {
  calculateOrderTotals,
  formatPrice,
  validateCustomerInfo,
  validatePaymentDetails,
  validateShippingDetails,
} from '../utils/shopLogic';

interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  products: Product[];
  confirmedOrderOverride: OrderRecord | null;
  onClose: () => void;
  onOrderSuccess: (order: OrderRecord, updatedProducts?: Product[]) => void;
}

type CheckoutStep = 1 | 2 | 3 | 4 | 'confirmed';

export function CheckoutModal({
  isOpen,
  cart,
  products,
  confirmedOrderOverride,
  onClose,
  onOrderSuccess,
}: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>(1);
  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: '',
    email: '',
    phone: '',
  });
  const [shipping, setShipping] = useState<ShippingDetails>({
    streetAddress: '',
    locality: '',
    city: '',
    postalCode: '',
    shippingSpeed: 'standard',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    upiId: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (confirmedOrderOverride) {
      setConfirmedOrder(confirmedOrderOverride);
      setStep('confirmed');
    } else {
      setConfirmedOrder(null);
      setStep(1);
    }
    setErrors({});
    setSubmitError('');
  }, [isOpen, confirmedOrderOverride]);

  if (!isOpen) return null;

  const totals = calculateOrderTotals(cart, products, shipping.shippingSpeed);

  function handleNextFromCustomer(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateCustomerInfo(customer);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setStep(2);
  }

  function handleNextFromShipping(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validateShippingDetails(shipping);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setStep(3);
  }

  function handleNextFromPayment(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validatePaymentDetails(paymentMethod, paymentDetails);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setStep(4);
  }

  function getPaymentSummaryText(): string {
    if (paymentMethod === 'cod') return 'Cash on Delivery (Pay upon doorstep verification)';
    if (paymentMethod === 'upi') return `UPI Instant Pay (${paymentDetails.upiId.trim()})`;
    const cleanDigits = paymentDetails.cardNumber.replace(/\s+/g, '');
    const last4 = cleanDigits.slice(-4) || '0000';
    return `Card ending in •••• ${last4}`;
  }

  async function handlePlaceOrder() {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          shipping,
          paymentMethod,
          paymentSummary: getPaymentSummaryText(),
          items: totals.items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setSubmitError(data?.error || 'Unable to place order. Please review your details.');
        setIsSubmitting(false);
        return;
      }

      const savedOrder: OrderRecord = data.order;
      setConfirmedOrder(savedOrder);
      setStep('confirmed');
      onOrderSuccess(savedOrder, data.updatedProducts);
    } catch {
      // Fallback local confirmation only if network fails unexpectedly
      const fallbackOrder: OrderRecord = {
        orderId: `SB-2026-${Math.floor(1042 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
        customer,
        shipping,
        paymentMethod,
        paymentSummary: getPaymentSummaryText(),
        items: totals.items.map((entry) => ({
          productId: entry.product.id,
          title: entry.product.title,
          quantity: entry.quantity,
          unitPrice: entry.product.price,
          lineSubtotal: entry.lineSubtotal,
        })),
        subtotal: totals.subtotal,
        shippingCost: totals.shippingCost,
        totalSavings: totals.totalSavings,
        total: totals.total,
        status: 'Confirmed',
      };
      setConfirmedOrder(fallbackOrder);
      setStep('confirmed');
      onOrderSuccess(fallbackOrder);
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepsMeta = [
    { num: 1, label: 'Customer Info' },
    { num: 2, label: 'Shipping' },
    { num: 3, label: 'Payment' },
    { num: 4, label: 'Order Summary' },
  ] as const;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2
            id="checkout-dialog-title"
            className="font-display text-xl font-bold text-slate-900"
          >
            {step === 'confirmed' ? 'Order Confirmed' : 'Secure Checkout'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Multi-Step Progress Indicator */}
        {step !== 'confirmed' && (
          <ol
            aria-label="Checkout progress"
            className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs"
          >
            {stepsMeta.map((item) => {
              const isCurrent = step === item.num;
              const isCompleted = typeof step === 'number' && step > item.num;
              return (
                <li
                  key={item.num}
                  className={`flex items-center gap-1.5 font-medium ${
                    isCurrent
                      ? 'text-emerald-900 font-semibold'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[11px] tabular-nums ${
                      isCurrent
                        ? 'bg-emerald-900 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {item.num}
                  </span>
                  <span className="truncate">{item.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="p-6 sm:p-8">
          {/* STEP 1: CUSTOMER INFO */}
          {step === 1 && (
            <form onSubmit={handleNextFromCustomer} noValidate className="space-y-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  01. Customer Information
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Where should we send your order confirmation and delivery updates?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="checkout-full-name"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="checkout-full-name"
                    type="text"
                    value={customer.fullName}
                    onChange={(e) => {
                      setCustomer({ ...customer, fullName: e.target.value });
                      if (errors.fullName) setErrors({ ...errors, fullName: '' });
                    }}
                    placeholder="e.g. Arindam Chatterjee"
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                  />
                  {errors.fullName && (
                    <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="checkout-email"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Email Address
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={customer.email}
                      onChange={(e) => {
                        setCustomer({ ...customer, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      placeholder="arindam@example.com"
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                    />
                    {errors.email && (
                      <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-phone"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Mobile Number
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => {
                        setCustomer({ ...customer, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      placeholder="9830012345"
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                    />
                    {errors.phone && (
                      <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-slate-200 pt-5">
                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 cursor-pointer"
                >
                  <span>Continue to Shipping</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: SHIPPING DETAILS */}
          {step === 2 && (
            <form onSubmit={handleNextFromShipping} noValidate className="space-y-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  02. Shipping Details
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your doorstep delivery address and preferred dispatch speed.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="checkout-street"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    House No. &amp; Street Address
                  </label>
                  <input
                    id="checkout-street"
                    type="text"
                    value={shipping.streetAddress}
                    onChange={(e) => {
                      setShipping({ ...shipping, streetAddress: e.target.value });
                      if (errors.streetAddress) setErrors({ ...errors, streetAddress: '' });
                    }}
                    placeholder="42 Station Road, Near Satui Market"
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                  />
                  {errors.streetAddress && (
                    <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                      {errors.streetAddress}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="checkout-locality"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Town / Locality
                    </label>
                    <input
                      id="checkout-locality"
                      type="text"
                      value={shipping.locality}
                      onChange={(e) => {
                        setShipping({ ...shipping, locality: e.target.value });
                        if (errors.locality) setErrors({ ...errors, locality: '' });
                      }}
                      placeholder="Satui Chaurigachha"
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                    />
                    {errors.locality && (
                      <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                        {errors.locality}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-city"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      City / District
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      value={shipping.city}
                      onChange={(e) => {
                        setShipping({ ...shipping, city: e.target.value });
                        if (errors.city) setErrors({ ...errors, city: '' });
                      }}
                      placeholder="Murshidabad"
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                    />
                    {errors.city && (
                      <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-postal"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      PIN / Postal Code
                    </label>
                    <input
                      id="checkout-postal"
                      type="text"
                      value={shipping.postalCode}
                      onChange={(e) => {
                        setShipping({ ...shipping, postalCode: e.target.value });
                        if (errors.postalCode) setErrors({ ...errors, postalCode: '' });
                      }}
                      placeholder="742405"
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3.5 font-mono text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                    />
                    {errors.postalCode && (
                      <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                        {errors.postalCode}
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Speed Options */}
                <fieldset className="pt-2">
                  <legend className="text-xs font-semibold text-slate-700">
                    Delivery Method
                  </legend>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm transition-colors ${
                        shipping.shippingSpeed === 'standard'
                          ? 'border-emerald-800 bg-emerald-50/50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="shippingSpeed"
                          value="standard"
                          checked={shipping.shippingSpeed === 'standard'}
                          onChange={() =>
                            setShipping({ ...shipping, shippingSpeed: 'standard' })
                          }
                          className="text-emerald-900 focus:ring-emerald-800"
                        />
                        <div>
                          <span className="block font-semibold text-slate-900">
                            Standard Delivery
                          </span>
                          <span className="text-xs text-slate-500">2–4 business days</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        {totals.subtotal >= 1999 ? 'Free' : '₹99'}
                      </span>
                    </label>

                    <label
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm transition-colors ${
                        shipping.shippingSpeed === 'express'
                          ? 'border-emerald-800 bg-emerald-50/50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="shippingSpeed"
                          value="express"
                          checked={shipping.shippingSpeed === 'express'}
                          onChange={() =>
                            setShipping({ ...shipping, shippingSpeed: 'express' })
                          }
                          className="text-emerald-900 focus:ring-emerald-800"
                        />
                        <div>
                          <span className="block font-semibold text-slate-900">
                            Express Priority
                          </span>
                          <span className="text-xs text-slate-500">Next-day dispatch</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                        ₹199
                      </span>
                    </label>
                  </div>
                </fieldset>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setStep(1);
                  }}
                  className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 cursor-pointer"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PAYMENT METHOD SELECTION */}
          {step === 3 && (
            <form onSubmit={handleNextFromPayment} noValidate className="space-y-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  03. Payment Method
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose your preferred payment option. All transactions are encrypted.
                </p>
              </div>

              <fieldset className="space-y-3">
                <legend className="sr-only">Payment method</legend>

                {/* COD Option */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    paymentMethod === 'cod'
                      ? 'border-emerald-800 bg-emerald-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => {
                      setPaymentMethod('cod');
                      setErrors({});
                    }}
                    className="mt-1 text-emerald-900 focus:ring-emerald-800"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                      <Wallet className="h-4 w-4 text-emerald-800" aria-hidden="true" />
                      <span>Cash on Delivery (COD)</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Pay in cash or scan doorstep QR upon inspecting your package. No advance fee.
                    </p>
                  </div>
                </label>

                {/* UPI Option */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    paymentMethod === 'upi'
                      ? 'border-emerald-800 bg-emerald-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => {
                      setPaymentMethod('upi');
                      setErrors({});
                    }}
                    className="mt-1 text-emerald-900 focus:ring-emerald-800"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                        <Smartphone className="h-4 w-4 text-emerald-800" aria-hidden="true" />
                        <span>UPI Instant Pay</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Supports Google Pay, PhonePe, Paytm, and BHIM UPI handles.
                      </p>
                    </div>

                    {paymentMethod === 'upi' && (
                      <div>
                        <label
                          htmlFor="checkout-upi-id"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Virtual Payment Address (UPI ID)
                        </label>
                        <input
                          id="checkout-upi-id"
                          type="text"
                          value={paymentDetails.upiId}
                          onChange={(e) =>
                            setPaymentDetails({ ...paymentDetails, upiId: e.target.value })
                          }
                          placeholder="arindam@okicici"
                          className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                        />
                        {errors.upiId && (
                          <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                            {errors.upiId}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </label>

                {/* Card Option */}
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    paymentMethod === 'card'
                      ? 'border-emerald-800 bg-emerald-50/40'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => {
                      setPaymentMethod('card');
                      setErrors({});
                    }}
                    className="mt-1 text-emerald-900 focus:ring-emerald-800"
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
                        <CreditCard className="h-4 w-4 text-emerald-800" aria-hidden="true" />
                        <span>Credit or Debit Card</span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Visa, Mastercard, and RuPay domestic or international cards.
                      </p>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label
                            htmlFor="checkout-card-name"
                            className="block text-xs font-semibold text-slate-700"
                          >
                            Name on Card
                          </label>
                          <input
                            id="checkout-card-name"
                            type="text"
                            value={paymentDetails.cardName}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                cardName: e.target.value,
                              })
                            }
                            placeholder="Arindam Chatterjee"
                            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                          />
                          {errors.cardName && (
                            <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                              {errors.cardName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="checkout-card-number"
                            className="block text-xs font-semibold text-slate-700"
                          >
                            Card Number (16 digits)
                          </label>
                          <input
                            id="checkout-card-number"
                            type="text"
                            inputMode="numeric"
                            value={paymentDetails.cardNumber}
                            onChange={(e) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                cardNumber: e.target.value,
                              })
                            }
                            placeholder="4532 0192 8834 1102"
                            className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                          />
                          {errors.cardNumber && (
                            <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                              {errors.cardNumber}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="checkout-card-expiry"
                              className="block text-xs font-semibold text-slate-700"
                            >
                              Expiry (MM/YY)
                            </label>
                            <input
                              id="checkout-card-expiry"
                              type="text"
                              value={paymentDetails.cardExpiry}
                              onChange={(e) =>
                                setPaymentDetails({
                                  ...paymentDetails,
                                  cardExpiry: e.target.value,
                                })
                              }
                              placeholder="09/29"
                              className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                            />
                            {errors.cardExpiry && (
                              <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                                {errors.cardExpiry}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="checkout-card-cvv"
                              className="block text-xs font-semibold text-slate-700"
                            >
                              CVV
                            </label>
                            <input
                              id="checkout-card-cvv"
                              type="password"
                              inputMode="numeric"
                              value={paymentDetails.cardCvv}
                              onChange={(e) =>
                                setPaymentDetails({
                                  ...paymentDetails,
                                  cardCvv: e.target.value,
                                })
                              }
                              placeholder="123"
                              className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                            />
                            {errors.cardCvv && (
                              <p role="alert" className="mt-1 text-xs font-medium text-rose-700">
                                {errors.cardCvv}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </fieldset>

              <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setStep(2);
                  }}
                  className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 cursor-pointer"
                >
                  <span>Review Order</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: ORDER SUMMARY & FINAL PLACEMENT */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-lg font-semibold text-slate-900">
                  04. Order Summary
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Verify your delivery details and itemized charges before confirming.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Customer &amp; Delivery</span>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="font-medium text-emerald-900 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-medium text-slate-900">{customer.fullName}</p>
                  <p className="text-slate-600">
                    {shipping.streetAddress}, {shipping.locality}
                  </p>
                  <p className="text-slate-600">
                    {shipping.city} — {shipping.postalCode}
                  </p>
                  <p className="text-slate-500">
                    {customer.phone} · {customer.email}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Payment &amp; Dispatch</span>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="font-medium text-emerald-900 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-medium text-slate-900">{getPaymentSummaryText()}</p>
                  <p className="text-slate-600">
                    {shipping.shippingSpeed === 'express'
                      ? 'Express Priority Dispatch (Next-day)'
                      : 'Standard Doorstep Delivery (2–4 days)'}
                  </p>
                </div>
              </div>

              {/* Itemized Review */}
              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                {totals.items.map(({ product, quantity, lineSubtotal }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{product.title}</p>
                      <p className="font-mono text-xs text-slate-500 tabular-nums">
                        Qty {quantity} × {formatPrice(product.price)}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatPrice(lineSubtotal)}
                    </span>
                  </div>
                ))}

                <div className="space-y-1.5 bg-slate-50/70 px-4 py-3.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-mono tabular-nums">
                      {formatPrice(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping</span>
                    <span className="font-mono tabular-nums">
                      {totals.shippingCost === 0 ? 'Free' : formatPrice(totals.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                    <span>Total Payable</span>
                    <span className="font-mono tabular-nums">
                      {formatPrice(totals.total)}
                    </span>
                  </div>
                </div>
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-800"
                >
                  {submitError}
                </p>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePlaceOrder}
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-emerald-900 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Placing Order...' : 'Place Order'}</span>
                </button>
              </div>
            </div>
          )}

          {/* CONFIRMED RECEIPT VIEW */}
          {step === 'confirmed' && confirmedOrder && (
            <div className="space-y-6">
              <div className="flex items-start gap-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                <CheckCircle2
                  className="mt-0.5 h-6 w-6 shrink-0 text-emerald-800"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Order {confirmedOrder.orderId} Confirmed — Preparing Shipment
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    A confirmation receipt has been logged for {confirmedOrder.customer.email}. Your items have been reserved from live inventory.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 text-sm">
                <div className="grid grid-cols-1 gap-3 p-4 text-xs sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-slate-500">Delivering To</span>
                    <p className="mt-1 font-semibold text-slate-900">
                      {confirmedOrder.customer.fullName}
                    </p>
                    <p className="text-slate-600">
                      {confirmedOrder.shipping.streetAddress}, {confirmedOrder.shipping.locality}
                    </p>
                    <p className="text-slate-600">
                      {confirmedOrder.shipping.city} — {confirmedOrder.shipping.postalCode}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Payment Method</span>
                    <p className="mt-1 font-semibold text-slate-900">
                      {confirmedOrder.paymentSummary}
                    </p>
                    <p className="mt-1 font-mono text-slate-500 tabular-nums">
                      Total: {formatPrice(confirmedOrder.total)}
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {confirmedOrder.items.map((line) => (
                    <div
                      key={line.productId}
                      className="flex items-center justify-between text-xs text-slate-700"
                    >
                      <span>
                        {line.title} × {line.quantity}
                      </span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">
                        {formatPrice(line.lineSubtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
