import { useState } from 'react';
import { ArrowLeft, Check, FileText, MapPin, Package, Shield, Store } from 'lucide-react';
import type { MarketplaceOrder, MarketplaceUser } from '../../types/marketplace';
import { formatInr, getCustomerScopedOrders } from '../../utils/marketplaceLogic';

interface CustomerPortalViewProps {
  currentUser: MarketplaceUser;
  allOrders: MarketplaceOrder[];
  onUpdateProfile: (updated: Partial<MarketplaceUser>) => void;
  onBackToStorefront: () => void;
}

const ORDER_STAGE_STEPS = ['Pending', 'Processing', 'Out for Delivery', 'Completed'] as const;

export function CustomerPortalView({
  currentUser,
  allOrders,
  onUpdateProfile,
  onBackToStorefront,
}: CustomerPortalViewProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone);
  const [address, setAddress] = useState(currentUser.address);
  const [pincode, setPincode] = useState(currentUser.pincode);
  const [savedNotice, setSavedNotice] = useState(false);

  // Strict Tier 1 Privacy Enforcement: ONLY current customer's orders
  const myOrders = getCustomerScopedOrders(allOrders, currentUser);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 2 || !/^\d{6}$/.test(pincode.trim())) return;
    onUpdateProfile({
      fullName: fullName.trim(),
      phone: phone.replace(/\D/g, ''),
      address: address.trim(),
      pincode: pincode.trim(),
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2000);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Portal Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
            <span>Tier 1 · Private Customer Portal · Isolated Account Session</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Welcome, {currentUser.fullName}
          </h1>
          <p className="text-xs text-slate-500">
            {currentUser.email} · +91 {currentUser.phone} · Default Pincode {currentUser.pincode}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="tablist"
            aria-label="Customer portal sections"
            className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Orders ({myOrders.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profile &amp; Address
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToStorefront}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Storefront</span>
          </button>
        </div>
      </div>

      {/* MY ORDERS & SHOP-WISE INVOICES */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
              <Package className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
              <h2 className="mt-3 font-display text-lg font-bold text-slate-900">
                No orders placed under your account yet
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Orders placed while signed in as {currentUser.fullName} appear here with real-time shop-wise tracking.
              </p>
              <button
                type="button"
                onClick={onBackToStorefront}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-900 px-5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            myOrders.map((order) => {
              const isExpanded =
                expandedOrderId === null
                  ? order.orderId === myOrders[0].orderId
                  : expandedOrderId === order.orderId;
              const currentStepIdx = ORDER_STAGE_STEPS.indexOf(order.overallStatus);

              return (
                <section
                  key={order.orderId}
                  aria-label={`Order ${order.orderId}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  {/* Order Top Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5 text-xs">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {order.orderId}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{order.createdAt}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-emerald-900">
                          {order.overallStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {order.vendorBreakdowns.length} Vendor Shop(s) · {order.paymentSummary} ·{' '}
                        {order.deliverySchedule.slotLabel}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 tabular-nums">
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500">Invoice Total</p>
                        <p className="font-display text-base font-bold text-slate-900">
                          {formatInr(order.grandTotal)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrderId(isExpanded ? '__none__' : order.orderId)
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                        <span>{isExpanded ? 'Hide Invoice' : 'View Invoice'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4-Stage Active Order Progress Tracker */}
                  <div className="px-6 py-4 border-b border-slate-100">
                    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                      {ORDER_STAGE_STEPS.map((stage, idx) => {
                        const reached = idx <= currentStepIdx;
                        return (
                          <li
                            key={stage}
                            className={`rounded-lg border px-3 py-2 font-semibold ${
                              reached
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                                : 'border-slate-200 bg-white text-slate-400'
                            }`}
                          >
                            <span className="font-mono text-[11px] mr-1.5">
                              0{idx + 1}.
                            </span>
                            {stage}
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {/* Expanded Shop-Wise Itemized Breakdown */}
                  {isExpanded && (
                    <div className="p-6 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                          <span>
                            Delivering to: {order.deliveryAddress.street},{' '}
                            {order.deliveryAddress.locality}, {order.deliveryAddress.city} —{' '}
                            {order.deliveryAddress.pincode}
                          </span>
                        </span>
                        <span className="tabular-nums">
                          Delivery Fee:{' '}
                          <strong>
                            {order.deliveryFee === 0 ? 'FREE' : formatInr(order.deliveryFee)}
                          </strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {order.vendorBreakdowns.map((vb) => (
                          <div
                            key={vb.shopId}
                            className="rounded-xl border border-slate-200 p-4 text-xs space-y-2.5"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="inline-flex items-center gap-1.5 font-display font-bold text-slate-900">
                                <Store className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                                <span>Sold by: {vb.shopName}</span>
                              </span>
                              <span className="font-mono font-semibold text-emerald-900">
                                {vb.vendorStatus}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {vb.items.map((item) => (
                                <div
                                  key={item.productId}
                                  className="flex justify-between gap-2 text-slate-600 tabular-nums"
                                >
                                  <span>
                                    {item.title} × {item.quantity}
                                  </span>
                                  <span className="font-mono font-medium text-slate-900">
                                    {formatInr(item.lineSubtotal)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-slate-900 tabular-nums">
                              <span>Shop Invoice Subtotal</span>
                              <span className="font-mono">{formatInr(vb.shopSubtotal)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })
          )}
        </div>
      )}

      {/* CUSTOMER PROFILE MANAGEMENT */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-slate-900">
            Account Profile &amp; Default Delivery Address
          </h2>
          <p className="text-xs text-slate-500">
            Only you can view or update these customer details.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cust-prof-name" className="block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <input
                id="cust-prof-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="cust-prof-phone" className="block text-xs font-semibold text-slate-700">
                Mobile Number
              </label>
              <input
                id="cust-prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="cust-prof-addr" className="block text-xs font-semibold text-slate-700">
                Street / Para Address
              </label>
              <input
                id="cust-prof-addr"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="cust-prof-pin" className="block text-xs font-semibold text-slate-700">
                Pincode
              </label>
              <input
                id="cust-prof-pin"
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-emerald-900 px-5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
            >
              {savedNotice ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Saved to Profile</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
