import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MessageSquare,
  Search,
} from 'lucide-react';
import type {
  AdminKpiMetrics,
  AdminOrder,
  AdminOrderStatus,
  MessageLanguage,
  MessageTemplateKind,
} from '../../types/admin';
import { buildWhatsAppLink, generateOrderMessage } from '../../utils/adminLogic';
import { formatPrice } from '../../utils/shopLogic';

interface OverviewAndOrdersPanelProps {
  mode: 'overview' | 'orders';
  kpis: AdminKpiMetrics;
  orders: AdminOrder[];
  hotline: string;
  onUpdateOrderStatus: (orderId: string, nextStatus: AdminOrderStatus) => void;
  onOpenSection: (section: 'orders' | 'market-rates' | 'blogger-xml') => void;
}

const ORDER_STATUSES: AdminOrderStatus[] = [
  'Pending',
  'Confirmed',
  'Packaging',
  'Dispatched',
  'Delivered',
];

export function OverviewAndOrdersPanel({
  mode,
  kpis,
  orders,
  hotline,
  onUpdateOrderStatus,
  onOpenSection,
}: OverviewAndOrdersPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminOrderStatus>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders[0]?.orderId || 'SB-7424-101'
  );
  const [templateKind, setTemplateKind] = useState<MessageTemplateKind>('confirmation');
  const [language, setLanguage] = useState<MessageLanguage>('en');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
      if (!q) return true;
      return (
        order.orderId.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.includes(q) ||
        order.address.toLowerCase().includes(q)
      );
    });
  }, [orders, searchTerm, statusFilter]);

  const activeOrder =
    orders.find((o) => o.orderId === selectedOrderId) || orders[0] || null;

  const generatedMessage = activeOrder
    ? generateOrderMessage(activeOrder, templateKind, language, hotline)
    : '';

  async function handleCopyText(text: string, tag: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for restricted clipboard contexts
    }
    setCopiedId(tag);
    window.setTimeout(() => {
      setCopiedId((curr) => (curr === tag ? null : curr));
    }, 1500);
  }

  return (
    <div className="space-y-6">
      {/* KPI Dashboard Metrics Grid */}
      {mode === 'overview' && (
        <section aria-label="KPI Dashboard Metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* KPI 1: Total Sales Today */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-slate-500">Total Sales Today</p>
            <p
              data-testid="kpi-sales-today"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums"
            >
              {formatPrice(kpis.totalSalesToday)}
            </p>
            <p className="mt-2 text-xs text-slate-600 tabular-nums">
              Total Orders Today: <strong className="font-mono text-slate-900">{kpis.totalOrdersToday}</strong>
            </p>
          </div>

          {/* KPI 2: Pending Delivery Queue */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500">
                Pending Delivery Queue
              </p>
              {kpis.pendingDeliveryQueue > 0 && (
                <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
              )}
            </div>
            <p
              data-testid="kpi-pending-queue"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums"
            >
              {kpis.pendingDeliveryQueue}
            </p>
            <p
              className={`mt-2 text-xs font-medium ${
                kpis.pendingDeliveryQueue > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {kpis.pendingDeliveryQueue > 0
                ? 'Action: Packaging & Dispatch Needed Immediately'
                : 'All active orders dispatched'}
            </p>
          </div>

          {/* KPI 3: Total Completed Orders */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500">
                Total Completed Orders
              </p>
              <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            </div>
            <p
              data-testid="kpi-completed-orders"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums"
            >
              {kpis.totalCompletedOrders}
            </p>
            <p className="mt-2 text-xs text-slate-600 tabular-nums">
              Delivered Today: <strong className="font-mono text-slate-900">{kpis.deliveredCount}</strong>
            </p>
          </div>

          {/* KPI 4: Low Stock Alerts */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500">Low Stock Alerts</p>
              {kpis.lowStockAlerts > 0 && (
                <AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden="true" />
              )}
            </div>
            <p
              data-testid="kpi-low-stock"
              className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 tabular-nums"
            >
              {kpis.lowStockAlerts}
            </p>
            <p className="mt-2 text-xs text-slate-600 tabular-nums">
              Total Listed Products:{' '}
              <strong className="font-mono text-slate-900">
                {kpis.totalListedProducts}
              </strong>
            </p>
          </div>
        </section>
      )}

      {/* Operations Shortcuts Strip on Overview */}
      {mode === 'overview' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-xs">
          <div className="text-slate-600">
            <strong className="text-slate-900">Morning Dispatch Checklist:</strong> Verify
            Mandi rates before 07:00 AM, send WhatsApp confirmations for COD orders, and
            assign local delivery riders.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenSection('market-rates')}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Update Market Rates
            </button>
            <button
              type="button"
              onClick={() => onOpenSection('blogger-xml')}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Blogger Stock Sync
            </button>
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <section
        aria-labelledby="recent-orders-heading"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2
              id="recent-orders-heading"
              className="font-display text-base font-bold text-slate-900"
            >
              Recent Orders Queue
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Update fulfillment stage or trigger instant COD confirmation messages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <label htmlFor="admin-order-search" className="sr-only">
                Search orders
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="admin-order-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ID, customer, address..."
                className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-800 focus:bg-white focus:outline-none"
              />
            </div>

            <label htmlFor="admin-order-status-filter" className="sr-only">
              Filter by order status
            </label>
            <select
              id="admin-order-status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | AdminOrderStatus)
              }
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                <th className="px-5 py-3">Order ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Customer &amp; Phone</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
                    No orders match your current filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusTone =
                    order.status === 'Delivered'
                      ? 'text-emerald-700'
                      : order.status === 'Confirmed' || order.status === 'Dispatched'
                      ? 'text-emerald-800'
                      : 'text-amber-700';

                  return (
                    <tr
                      key={order.orderId}
                      className={`transition-colors hover:bg-slate-50/80 ${
                        selectedOrderId === order.orderId ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {order.orderId}
                        <span className="block font-sans text-[11px] font-normal text-slate-400">
                          {order.placedAt}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <label
                          htmlFor={`status-select-${order.orderId}`}
                          className="sr-only"
                        >
                          Update status for {order.orderId}
                        </label>
                        <select
                          id={`status-select-${order.orderId}`}
                          value={order.status}
                          onChange={(e) =>
                            onUpdateOrderStatus(
                              order.orderId,
                              e.target.value as AdminOrderStatus
                            )
                          }
                          className={`h-8 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold focus:border-emerald-800 focus:outline-none cursor-pointer ${statusTone}`}
                        >
                          {ORDER_STATUSES.map((st) => (
                            <option key={st} value={st} className="text-slate-900">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{order.customerName}</p>
                        <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {order.phone}
                        </p>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">{order.address}</td>

                      <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap tabular-nums">
                        <span className="font-medium text-slate-900">
                          {order.itemCount} {order.itemCount === 1 ? 'product' : 'products'}
                        </span>
                        <span className="block max-w-[210px] truncate text-[11px] text-slate-500">
                          {order.itemsDetail.map((i) => i.name).join(', ')}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap tabular-nums">
                        {formatPrice(order.total)}
                      </td>

                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {order.paymentMethod}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.orderId)}
                          aria-label={`Compose SMS or WhatsApp for ${order.orderId}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-emerald-800" aria-hidden="true" />
                          <span>SMS / WhatsApp</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Automated SMS / WhatsApp Order Confirmation Composer */}
      {activeOrder && (
        <section
          aria-labelledby="message-automation-heading"
          className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
            <div>
              <h2
                id="message-automation-heading"
                className="font-display text-base font-bold text-slate-900"
              >
                Automated SMS &amp; WhatsApp Confirmation Templates
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Auto-populated with live customer name, delivery locality, item count, and{' '}
                {activeOrder.paymentMethod} payable amount.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="template-order-picker" className="sr-only">
                Select order for message template
              </label>
              <select
                id="template-order-picker"
                value={activeOrder.orderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs font-semibold text-slate-900 focus:border-emerald-800 focus:outline-none cursor-pointer"
              >
                {orders.map((o) => (
                  <option key={o.orderId} value={o.orderId}>
                    {o.orderId} — {o.customerName} ({formatPrice(o.total)})
                  </option>
                ))}
              </select>

              {/* Template Stage Switcher */}
              <div
                role="group"
                aria-label="Message stage"
                className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              >
                {(
                  [
                    { id: 'confirmation', label: 'Confirmed' },
                    { id: 'dispatch', label: 'Out for Delivery' },
                    { id: 'delivered', label: 'Delivered' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplateKind(item.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      templateKind === item.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Language Switcher */}
              <div
                role="group"
                aria-label="Message language"
                className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                    language === 'en'
                      ? 'bg-emerald-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                    language === 'bn'
                      ? 'bg-emerald-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bengali (বাংলা)
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <label htmlFor="generated-sms-preview" className="sr-only">
                Generated confirmation message
              </label>
              <textarea
                id="generated-sms-preview"
                readOnly
                rows={3}
                value={generatedMessage}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs lg:col-span-4">
              <div className="space-y-1 text-slate-600">
                <p>
                  Recipient: <strong className="text-slate-900">{activeOrder.customerName}</strong>
                </p>
                <p className="font-mono tabular-nums">
                  Mobile: +91 {activeOrder.phone} · {formatPrice(activeOrder.total)} ({activeOrder.paymentMethod})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(generatedMessage, `msg-${activeOrder.orderId}`)
                  }
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-900 px-3 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap cursor-pointer"
                >
                  {copiedId === `msg-${activeOrder.orderId}` ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copied Text</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>

                <a
                  href={buildWhatsAppLink(activeOrder.phone, generatedMessage)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                >
                  <span>WhatsApp</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
