import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, CreditCard, MapPin, Store, X } from 'lucide-react';
import { DELIVERY_SLOTS } from '../../data/marketplaceSeed';
import type {
  GroupedCartSummary,
  MarketplaceOrder,
  MarketplaceUser,
  OrderVendorBreakdown,
  PaymentMethodType,
  VendorShop,
} from '../../types/marketplace';
import {
  formatInr,
  validateCheckoutAddress,
  validateCheckoutPayment,
} from '../../utils/marketplaceLogic';

interface MarketplaceCheckoutModalProps {
  isOpen: boolean;
  summary: GroupedCartSummary;
  shops: VendorShop[];
  currentUser: MarketplaceUser | null;
  selectedPincode: string;
  onClose: () => void;
  onCompleteOrder: (order: MarketplaceOrder) => void;
  onOpenCustomerOrders: () => void;
}

type CheckoutStep = 1 | 2 | 3 | 4;

export function MarketplaceCheckoutModal({
  isOpen,
  summary,
  shops,
  currentUser,
  selectedPincode,
  onClose,
  onCompleteOrder,
  onOpenCustomerOrders,
}: MarketplaceCheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>(1);
  const wasOpenRef = useRef(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [locality, setLocality] = useState('Satui Bazar');
  const [city, setCity] = useState('Murshidabad');
  const [pincode, setPincode] = useState(selectedPincode);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const [slotId, setSlotId] = useState(DELIVERY_SLOTS[0].id);
  const [instructions, setInstructions] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  const [confirmedOrder, setConfirmedOrder] = useState<MarketplaceOrder | null>(null);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setStep(1);
      setConfirmedOrder(null);
      setAddressErrors({});
      setPaymentErrors({});
      setPincode(currentUser?.pincode || selectedPincode || '742405');
      if (currentUser) {
        setFullName(currentUser.fullName);
        setPhone(currentUser.phone);
        setEmail(currentUser.email);
        setStreet(currentUser.address);
      }
      setSlotId(
        summary.hasPerishableOrFastFood
          ? 'slot-hyperlocal-35'
          : 'slot-evening'
      );
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, currentUser, selectedPincode, summary.hasPerishableOrFastFood]);

  if (!isOpen) return null;

  function handleContinueFromAddress(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateCheckoutAddress({
      fullName,
      phone,
      email,
      street,
      locality,
      city,
      pincode,
    });
    if (Object.keys(errs).length > 0) {
      setAddressErrors(errs);
      return;
    }
    setAddressErrors({});
    setStep(2);
  }

  function handleContinueFromSchedule(e: React.FormEvent) {
    e.preventDefault();
    setStep(3);
  }

  function handlePlaceMultiVendorOrder(e: React.FormEvent) {
    e.preventDefault();
    const pErrs = validateCheckoutPayment(
      paymentMethod,
      upiId,
      cardNumber,
      cardExpiry,
      cardCvv
    );
    if (Object.keys(pErrs).length > 0) {
      setPaymentErrors(pErrs);
      return;
    }
    setPaymentErrors({});

    const shopMap = new Map(shops.map((s) => [s.id, s]));
    const nowDisplay = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const vendorBreakdowns: OrderVendorBreakdown[] = summary.groups.map((grp) => {
      const shopInfo = shopMap.get(grp.shopId);
      const commPct = shopInfo?.commissionRatePct ?? 8;
      const platformCommission = Math.round((grp.shopSubtotal * commPct) / 100);
      const vendorNetEarnings = grp.shopSubtotal - platformCommission;

      return {
        shopId: grp.shopId,
        shopName: grp.shopName,
        vendorStatus: 'Pending',
        items: grp.items.map((entry) => ({
          productId: entry.product.id,
          sku: entry.product.sku,
          title: entry.product.title,
          unitLabel: entry.product.unitLabel,
          quantity: entry.quantity,
          mrp: entry.product.mrp,
          unitPrice: entry.product.price,
          lineSubtotal: entry.lineSubtotal,
        })),
        shopSubtotal: grp.shopSubtotal,
        platformCommission,
        vendorNetEarnings,
        updatedAt: nowDisplay,
      };
    });

    const chosenSlot =
      DELIVERY_SLOTS.find((s) => s.id === slotId) || DELIVERY_SLOTS[0];

    const paymentSummary =
      paymentMethod === 'cod'
        ? 'Cash on Delivery (COD)'
        : paymentMethod === 'upi'
        ? `UPI (${upiId.trim()})`
        : `Card ending in ${cardNumber.replace(/\s+/g, '').slice(-4)}`;

    const order: MarketplaceOrder = {
      orderId: `SB-MV-${Math.floor(1050 + (Date.now() % 8900))}`,
      customerId: currentUser?.id || 'guest-customer',
      customerName: fullName.trim(),
      customerEmail: email.trim(),
      customerPhone: phone.replace(/\D/g, ''),
      deliveryAddress: {
        street: street.trim(),
        locality: locality.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
      },
      deliverySchedule: {
        slotId: chosenSlot.id,
        slotLabel: chosenSlot.label,
        instructions: instructions.trim(),
      },
      paymentMethod,
      paymentSummary,
      overallStatus: 'Pending',
      vendorBreakdowns,
      subtotal: summary.subtotal,
      deliveryFee: summary.deliveryFee,
      totalSavings: summary.totalSavings,
      grandTotal: summary.grandTotal,
      createdAt: nowDisplay,
    };

    setConfirmedOrder(order);
    onCompleteOrder(order);
    setStep(4);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mv-checkout-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2
              id="mv-checkout-heading"
              className="font-display text-lg font-bold text-slate-900 sm:text-xl"
            >
              {step === 4
                ? 'Multi-Vendor Order Confirmed'
                : 'Satuibazar Multi-Vendor Checkout'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {step === 1 && 'Step 1 of 4 · Delivery Address & Recipient'}
              {step === 2 && 'Step 2 of 4 · Hyperlocal & Standard Delivery Schedule'}
              {step === 3 && 'Step 3 of 4 · Payment Method & Shop Breakdown'}
              {step === 4 && 'Step 4 of 4 · Itemized Shop-Wise Invoice'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Step Progress Strip */}
        <ol className="mt-4 grid grid-cols-4 gap-2 text-center text-[11px] font-semibold">
          {(
            [
              { num: 1, label: '1. Address' },
              { num: 2, label: '2. Schedule' },
              { num: 3, label: '3. Payment' },
              { num: 4, label: '4. Confirmed' },
            ] as const
          ).map((item) => (
            <li
              key={item.num}
              className={`rounded-md py-1.5 ${
                step === item.num
                  ? 'bg-emerald-900 text-white'
                  : step > item.num
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {item.label}
            </li>
          ))}
        </ol>

        {/* STEP 1: DELIVERY ADDRESS */}
        {step === 1 && (
          <form onSubmit={handleContinueFromAddress} noValidate className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="chk-fullname" className="block text-xs font-semibold text-slate-700">
                  Recipient Full Name
                </label>
                <input
                  id="chk-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Subrata Mondal"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                />
                {addressErrors.fullName && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    {addressErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="chk-phone" className="block text-xs font-semibold text-slate-700">
                  10-Digit Mobile Number
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9832109876"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                />
                {addressErrors.phone && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    {addressErrors.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="chk-email" className="block text-xs font-semibold text-slate-700">
                Email Address (for Shop-Wise Invoice)
              </label>
              <input
                id="chk-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="subrata@satuibazar.in"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
              {addressErrors.email && (
                <p role="alert" className="mt-1 text-xs text-rose-700">
                  {addressErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="chk-street" className="block text-xs font-semibold text-slate-700">
                House / Para / Street Address
              </label>
              <input
                id="chk-street"
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="House 18, Salui Uttarpara Main Lane"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
              {addressErrors.street && (
                <p role="alert" className="mt-1 text-xs text-rose-700">
                  {addressErrors.street}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="chk-locality" className="block text-xs font-semibold text-slate-700">
                  Locality
                </label>
                <input
                  id="chk-locality"
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="chk-city" className="block text-xs font-semibold text-slate-700">
                  City / District
                </label>
                <input
                  id="chk-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                />
                {addressErrors.city && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    {addressErrors.city}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="chk-pincode" className="block text-xs font-semibold text-slate-700">
                  Delivery Pincode
                </label>
                <input
                  id="chk-pincode"
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
                />
                {addressErrors.pincode && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    {addressErrors.pincode}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-900 px-6 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                Continue to Delivery Schedule
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: DELIVERY SCHEDULE */}
        {step === 2 && (
          <form onSubmit={handleContinueFromSchedule} className="mt-6 space-y-5">
            {summary.hasPerishableOrFastFood && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-950">
                <strong className="font-semibold">Fresh Produce / Fast Food Detected:</strong>{' '}
                Your cart includes hyperlocal items eligible for 35–45 minute insulated dispatch.
              </div>
            )}

            <fieldset className="space-y-2.5">
              <legend className="text-xs font-semibold text-slate-700">
                Select Preferred Delivery Window
              </legend>
              {DELIVERY_SLOTS.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs cursor-pointer ${
                    slotId === slot.id
                      ? 'border-emerald-900 bg-emerald-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2.5 font-medium text-slate-900">
                    <input
                      type="radio"
                      name="deliverySlot"
                      value={slot.id}
                      checked={slotId === slot.id}
                      onChange={() => setSlotId(slot.id)}
                      className="h-4 w-4 accent-emerald-900"
                    />
                    <Clock className="h-3.5 w-3.5 text-emerald-800 shrink-0" aria-hidden="true" />
                    <span>{slot.label}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                    {slot.badge}
                  </span>
                </label>
              ))}
            </fieldset>

            <div>
              <label htmlFor="chk-instructions" className="block text-xs font-semibold text-slate-700">
                Delivery Rider Instructions (Optional)
              </label>
              <input
                id="chk-instructions"
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Ring ground-floor bell or call on arrival"
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Back to Address
              </button>
              <button
                type="submit"
                className="h-10 rounded-lg bg-emerald-900 px-6 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                Continue to Payment
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PAYMENT METHOD & SHOP-WISE REVIEW */}
        {step === 3 && (
          <form onSubmit={handlePlaceMultiVendorOrder} noValidate className="mt-6 space-y-5">
            <fieldset className="space-y-2.5">
              <legend className="text-xs font-semibold text-slate-700">
                Choose Payment Method
              </legend>
              {(
                [
                  {
                    id: 'cod',
                    title: 'Cash on Delivery (COD)',
                    desc: 'Pay cash or doorstep QR upon receiving your shop packages.',
                  },
                  {
                    id: 'upi',
                    title: 'UPI Instant Payment (GPay / PhonePe / Paytm)',
                    desc: 'Zero-fee instant UPI verification across all participating vendors.',
                  },
                  {
                    id: 'card',
                    title: 'Credit / Debit Card (RuPay / Visa / Mastercard)',
                    desc: 'Encrypted card settlement with automatic vendor split.',
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.id}
                  className={`block rounded-xl border p-3.5 text-xs cursor-pointer ${
                    paymentMethod === opt.id
                      ? 'border-emerald-900 bg-emerald-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.id}
                      checked={paymentMethod === opt.id}
                      onChange={() => {
                        setPaymentMethod(opt.id);
                        setPaymentErrors({});
                      }}
                      className="h-4 w-4 accent-emerald-900"
                    />
                    <CreditCard className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                    <span className="font-semibold text-slate-900">{opt.title}</span>
                  </div>
                  <p className="mt-1 pl-6 text-[11px] text-slate-500">{opt.desc}</p>
                </label>
              ))}
            </fieldset>

            {paymentMethod === 'upi' && (
              <div>
                <label htmlFor="chk-upi" className="block text-xs font-semibold text-slate-700">
                  Enter UPI ID
                </label>
                <input
                  id="chk-upi"
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="subrata@okaxis"
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm focus:border-emerald-800 focus:outline-none"
                />
                {paymentErrors.upiId && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    {paymentErrors.upiId}
                  </p>
                )}
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label htmlFor="chk-card-num" className="block text-xs font-semibold text-slate-700">
                    Card Number
                  </label>
                  <input
                    id="chk-card-num"
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532015112830366"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                  />
                  {paymentErrors.cardNumber && (
                    <p role="alert" className="mt-1 text-xs text-rose-700">
                      {paymentErrors.cardNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="chk-card-exp" className="block text-xs font-semibold text-slate-700">
                    Expiry (MM/YY)
                  </label>
                  <input
                    id="chk-card-exp"
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="08/29"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                  />
                  {paymentErrors.cardExpiry && (
                    <p role="alert" className="mt-1 text-xs text-rose-700">
                      {paymentErrors.cardExpiry}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="chk-card-cvv" className="block text-xs font-semibold text-slate-700">
                    CVV
                  </label>
                  <input
                    id="chk-card-cvv"
                    type="password"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
                  />
                  {paymentErrors.cardCvv && (
                    <p role="alert" className="mt-1 text-xs text-rose-700">
                      {paymentErrors.cardCvv}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Shop-Wise Breakdown Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs tabular-nums">
              <p className="font-semibold text-slate-900">
                Shop-Wise Order Split ({summary.distinctShopCount}{' '}
                {summary.distinctShopCount === 1 ? 'Vendor' : 'Vendors'})
              </p>
              {summary.groups.map((grp) => (
                <div key={grp.shopId} className="flex justify-between text-slate-600">
                  <span>
                    {grp.shopName} ({grp.itemCount}{' '}
                    {grp.itemCount === 1 ? 'item' : 'items'})
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatInr(grp.shopSubtotal)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Total Payable ({paymentMethod.toUpperCase()})</span>
                <span className="font-mono">{formatInr(summary.grandTotal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Back to Schedule
              </button>
              <button
                type="submit"
                className="h-10 rounded-lg bg-emerald-900 px-6 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                Place Order ({formatInr(summary.grandTotal)})
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: ORDER CONFIRMATION & SHOP-WISE INVOICE */}
        {step === 4 && confirmedOrder && (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-slate-800 space-y-1">
              <p className="inline-flex items-center gap-2 font-display text-base font-bold text-emerald-950">
                <CheckCircle2 className="h-5 w-5 text-emerald-800" aria-hidden="true" />
                <span>Order {confirmedOrder.orderId} Placed Successfully</span>
              </p>
              <p className="text-slate-600">
                Routed simultaneously to {confirmedOrder.vendorBreakdowns.length}{' '}
                participating shop(s) · {confirmedOrder.deliverySchedule.slotLabel}
              </p>
              <p className="inline-flex items-center gap-1 text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                <span>
                  {confirmedOrder.deliveryAddress.street},{' '}
                  {confirmedOrder.deliveryAddress.city} —{' '}
                  {confirmedOrder.deliveryAddress.pincode}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              {confirmedOrder.vendorBreakdowns.map((vb) => (
                <div
                  key={vb.shopId}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                      <Store className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                      <span>Sold by: {vb.shopName}</span>
                    </span>
                    <span className="font-mono font-semibold text-amber-700">
                      Status: {vb.vendorStatus}
                    </span>
                  </div>
                  {vb.items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-slate-600 tabular-nums">
                      <span>
                        {item.title} × {item.quantity}
                      </span>
                      <span className="font-mono text-slate-900">
                        {formatInr(item.lineSubtotal)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900 tabular-nums">
                    <span>Shop Invoice Subtotal</span>
                    <span className="font-mono">{formatInr(vb.shopSubtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              {currentUser?.role === 'customer' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCustomerOrders();
                  }}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                >
                  Track in My Orders
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg bg-emerald-900 px-6 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
