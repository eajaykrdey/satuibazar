import { useState } from 'react';
import { Check, Copy, Download, RefreshCw, Save } from 'lucide-react';
import type {
  DiscountCoupon,
  MarketRateItem,
  ShopConfiguration,
} from '../../types/admin';
import {
  calculateMarketRateDelta,
  generateBloggerSyncSnippet,
} from '../../utils/adminLogic';
import { formatPrice } from '../../utils/shopLogic';

interface OperationsAndBloggerPanelProps {
  mode: 'market-rates' | 'coupons' | 'config' | 'blogger-xml';
  marketRates: MarketRateItem[];
  coupons: DiscountCoupon[];
  config: ShopConfiguration;
  onPublishMarketRates: (updated: MarketRateItem[]) => Promise<void>;
  onToggleCoupon: (code: string) => void;
  onAddCoupon: (coupon: DiscountCoupon) => void;
  onUpdateConfig: (partial: Partial<ShopConfiguration>) => Promise<void>;
}

export function OperationsAndBloggerPanel({
  mode,
  marketRates,
  coupons,
  config,
  onPublishMarketRates,
  onToggleCoupon,
  onAddCoupon,
  onUpdateConfig,
}: OperationsAndBloggerPanelProps) {
  const [draftRates, setDraftRates] = useState<MarketRateItem[]>(marketRates);
  const [isPublishingRates, setIsPublishingRates] = useState(false);
  const [ratePublishBanner, setRatePublishBanner] = useState('');

  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newVal, setNewVal] = useState('40');
  const [newMin, setNewMin] = useState('499');

  const [copiedXml, setCopiedXml] = useState(false);
  const [liveFeedSample, setLiveFeedSample] = useState<string>('');
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  if (mode === 'market-rates') {
    function handleDraftRateChange(
      id: string,
      field: 'wholesaleCost' | 'todayRetailRate' | 'inStock',
      value: number | boolean
    ) {
      setDraftRates((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
      setRatePublishBanner('');
    }

    async function handleSaveAllRates() {
      setIsPublishingRates(true);
      await onPublishMarketRates(draftRates);
      setIsPublishingRates(false);
      setRatePublishBanner(
        `Published ${draftRates.length} daily commodity rates to live catalog & Blogger JSON feed.`
      );
    }

    function handleExportRatesCsv() {
      const header = 'Commodity,Unit,Wholesale_Cost_INR,Retail_Rate_INR,In_Stock\n';
      const rows = draftRates
        .map(
          (r) =>
            `"${r.commodity}","${r.unit}",${r.wholesaleCost},${r.todayRetailRate},${r.inStock}`
        )
        .join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'satuibazar-daily-market-rates.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Today&apos;s Local Market Rates (Batch Updater)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Morning Mandi workflow: enter wholesale landing cost and retail rate for fish, potatoes, and cooking oils, then publish in one click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportRatesCsv}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              disabled={isPublishingRates}
              onClick={handleSaveAllRates}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-900 px-4 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {isPublishingRates ? 'Publishing...' : "Publish Today's Rates"}
              </span>
            </button>
          </div>
        </div>

        {ratePublishBanner && (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900"
          >
            {ratePublishBanner}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="px-5 py-3">Commodity &amp; Grade</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Mandi Cost (₹)</th>
                  <th className="px-4 py-3 text-right">Yesterday (₹)</th>
                  <th className="px-4 py-3 text-right">Today&apos;s Retail (₹)</th>
                  <th className="px-4 py-3 text-right">Daily Change</th>
                  <th className="px-4 py-3 text-right">Margin</th>
                  <th className="px-5 py-3 text-center">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {draftRates.map((item) => {
                  const delta = calculateMarketRateDelta(
                    item.todayRetailRate,
                    item.previousRetailRate
                  );
                  const marginPct =
                    item.todayRetailRate > 0
                      ? Math.round(
                          ((item.todayRetailRate - item.wholesaleCost) /
                            item.todayRetailRate) *
                            100
                        )
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{item.commodity}</p>
                        <p className="text-[11px] text-slate-500">{item.variety}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          aria-label={`Wholesale cost for ${item.commodity}`}
                          value={item.wholesaleCost}
                          onChange={(e) =>
                            handleDraftRateChange(
                              item.id,
                              'wholesaleCost',
                              Number(e.target.value)
                            )
                          }
                          className="h-8 w-20 rounded border border-slate-200 px-2 text-right font-mono text-xs text-slate-800 focus:border-emerald-800 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500 tabular-nums">
                        {formatPrice(item.previousRetailRate)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          aria-label={`Today retail rate for ${item.commodity}`}
                          value={item.todayRetailRate}
                          onChange={(e) =>
                            handleDraftRateChange(
                              item.id,
                              'todayRetailRate',
                              Number(e.target.value)
                            )
                          }
                          className="h-8 w-20 rounded border border-emerald-700/40 bg-emerald-50/30 px-2 text-right font-mono text-xs font-bold text-slate-900 focus:border-emerald-800 focus:bg-white focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            delta.direction === 'up'
                              ? 'text-amber-700'
                              : delta.direction === 'down'
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                          }
                        >
                          {delta.diff > 0
                            ? `+₹${delta.diff}`
                            : delta.diff < 0
                            ? `-₹${Math.abs(delta.diff)}`
                            : 'No change'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700 tabular-nums">
                        {marginPct}%
                      </td>
                      <td className="px-5 py-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`${item.commodity} available today`}
                          checked={item.inStock}
                          onChange={(e) =>
                            handleDraftRateChange(item.id, 'inStock', e.target.checked)
                          }
                          className="h-4 w-4 rounded border-slate-300 text-emerald-900"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended 3-Step Daily Market Workflow */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-display text-sm font-bold text-slate-900">
              01. 06:15 AM Mandi Check
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Record landing rates from Satui Ghat fish auction and Berhampore potato yard directly into the Mandi Cost column.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-display text-sm font-bold text-slate-900">
              02. Margin Guardrail Review
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Adjust Today&apos;s Retail price to keep 12%–18% perishable margin while flagging out-of-season items unavailable.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-display text-sm font-bold text-slate-900">
              03. Single-Click Feed Sync
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Publishing updates `/api/blogger-feed.json` immediately so storefront and Blogger cards reflect live rates with zero XML edits.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'coupons') {
    function handleCreateCoupon(e: React.FormEvent) {
      e.preventDefault();
      if (!newCode.trim() || !newDesc.trim()) return;
      onAddCoupon({
        code: newCode.trim().toUpperCase(),
        description: newDesc.trim(),
        discountType: 'flat',
        value: Number(newVal) || 50,
        minOrder: Number(newMin) || 299,
        usedCount: 0,
        active: true,
      });
      setNewCode('');
      setNewDesc('');
    }

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-base font-bold text-slate-900">
            Coupons &amp; Discount Codes
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Manage promotional codes for local Satui &amp; Shaktipur campaigns.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                <th className="px-5 py-3">Coupon Code</th>
                <th className="px-4 py-3">Offer Description</th>
                <th className="px-4 py-3 text-right">Min. Order</th>
                <th className="px-4 py-3 text-right">Redemptions</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {coupons.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 font-mono font-bold text-emerald-900">
                    {c.code}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">{c.description}</td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                    {formatPrice(c.minOrder)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                    {c.usedCount}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleCoupon(c.code)}
                      className={`rounded-lg border px-3 py-1 text-xs font-semibold cursor-pointer ${
                        c.active
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.active ? 'Active' : 'Paused'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          onSubmit={handleCreateCoupon}
          className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-5"
        >
          <input
            type="text"
            aria-label="New coupon code"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="CODE (e.g. WINTER40)"
            className="h-9 rounded-lg border border-slate-200 px-3 font-mono text-xs"
          />
          <input
            type="text"
            aria-label="Coupon description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="₹40 off above ₹499"
            className="h-9 rounded-lg border border-slate-200 px-3 text-xs sm:col-span-2"
          />
          <input
            type="number"
            aria-label="Discount value in INR"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder="40"
            className="h-9 rounded-lg border border-slate-200 px-3 font-mono text-xs"
          />
          <button
            type="submit"
            className="h-9 rounded-lg bg-emerald-900 px-4 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
          >
            Create Coupon
          </button>
        </form>
      </div>
    );
  }

  if (mode === 'config') {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Shop Configuration &amp; Live Operational Controls
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Changes immediately update header status indicators and `/api/blogger-feed.json`.
            </p>
          </div>

          <div className="divide-y divide-slate-200 border-t border-slate-200">
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Shop Status ({config.shopOpen ? 'Open — LIVE' : 'Closed'})
                </p>
                <p className="text-xs text-slate-500">
                  Controls whether Satuibazar displays Open (LIVE) across storefront and Blogger header.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onUpdateConfig({ shopOpen: !config.shopOpen })}
                className={`h-9 rounded-lg px-4 text-xs font-semibold cursor-pointer ${
                  config.shopOpen
                    ? 'bg-emerald-900 text-white hover:bg-emerald-800'
                    : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                }`}
              >
                {config.shopOpen ? 'Set Closed' : 'Set Open (LIVE)'}
              </button>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Online Ordering ({config.onlineOrderingActive ? 'Active' : 'Paused'})
                </p>
                <p className="text-xs text-slate-500">
                  Temporarily pause checkout intake during heavy monsoon weather or stock audits.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({ onlineOrderingActive: !config.onlineOrderingActive })
                }
                className={`h-9 rounded-lg px-4 text-xs font-semibold cursor-pointer ${
                  config.onlineOrderingActive
                    ? 'bg-emerald-900 text-white hover:bg-emerald-800'
                    : 'bg-amber-600 text-white hover:bg-amber-500'
                }`}
              >
                {config.onlineOrderingActive ? 'Pause Ordering' : 'Activate Ordering'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="cfg-free-del"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Free Delivery Threshold (₹)
                </label>
                <input
                  id="cfg-free-del"
                  type="number"
                  value={config.freeDeliveryMinOrder}
                  onChange={(e) =>
                    onUpdateConfig({ freeDeliveryMinOrder: Number(e.target.value) })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-sla"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Express SLA (Minutes)
                </label>
                <input
                  id="cfg-sla"
                  type="number"
                  value={config.dispatchSlaMinutes}
                  onChange={(e) =>
                    onUpdateConfig({ dispatchSlaMinutes: Number(e.target.value) })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="cfg-hotline"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Dispatch Hotline
                </label>
                <input
                  id="cfg-hotline"
                  type="text"
                  value={config.hotlinePrimary}
                  onChange={(e) =>
                    onUpdateConfig({ hotlinePrimary: e.target.value })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Blogger XML Theme & Code Sync View
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://satuibazar.example.com';
  const xmlSnippet = generateBloggerSyncSnippet(origin);

  async function handleInspectLiveFeed() {
    setIsLoadingFeed(true);
    try {
      const res = await fetch('/api/blogger-feed.json');
      const json = await res.json();
      setLiveFeedSample(JSON.stringify(json, null, 2));
    } catch {
      setLiveFeedSample('{"error": "Unable to fetch local feed preview"}');
    } finally {
      setIsLoadingFeed(false);
    }
  }

  async function handleCopySnippet() {
    try {
      await navigator.clipboard.writeText(xmlSnippet);
    } catch {
      // Ignore clipboard restriction
    }
    setCopiedXml(true);
    window.setTimeout(() => setCopiedXml(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <h2 className="font-display text-base font-bold text-slate-900">
          Blogger XML Theme &amp; Live Stock Sync Architecture
        </h2>
        <p className="text-xs leading-relaxed text-slate-600">
          Blogger XML templates are static layouts—editing XML manually every time fish or potato stock changes is slow and error-prone. Instead, embed lightweight `data-sb-sku` attributes in your Blogger product cards once, and let your Blogger theme hydrate live prices and stock from this hub&apos;s CORS-enabled JSON endpoint (`/api/blogger-feed.json`) or a published Google Sheet / Firebase Realtime node.
        </p>

        <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3 text-xs">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
            <p className="font-semibold text-slate-900">1. Static Shell in Blogger XML</p>
            <p className="mt-1 text-slate-600">
              Add `data-sb-sku=&quot;SB-FSH-001&quot;` on each Blogger product card container, `data-sb-price` on the price span, and `data-sb-add-btn` on the button.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
            <p className="font-semibold text-slate-900">2. Decoupled JSON Stock Feed</p>
            <p className="mt-1 text-slate-600">
              Admin Master Hub serves live stock, shop open status, and daily Mandi rates at `/api/blogger-feed.json` with `Cache-Control: no-store`.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
            <p className="font-semibold text-slate-900">3. Automatic Sold-Out Guard</p>
            <p className="mt-1 text-slate-600">
              On page load, the script updates prices and disables `Add to Bag` buttons whenever `stock &lt;= 0`, preventing overselling on COD orders.
            </p>
          </div>
        </div>
      </div>

      {/* Ready-to-Paste Blogger XML Script */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">
              Ready-to-Paste Blogger XML Footer Script (Before &lt;/body&gt;)
            </h3>
            <p className="text-xs text-slate-500">
              Paste once inside Blogger &rarr; Theme &rarr; Edit HTML right above `&lt;/body&gt;`.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInspectLiveFeed}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingFeed ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Test Live JSON Feed</span>
            </button>

            <button
              type="button"
              onClick={handleCopySnippet}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
            >
              {copiedXml ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copied Snippet</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy Blogger Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-200">
          <code>{xmlSnippet}</code>
        </pre>

        {liveFeedSample && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-slate-700">
              Live `/api/blogger-feed.json` Response Preview:
            </p>
            <pre className="max-h-60 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[11px] text-slate-800">
              <code>{liveFeedSample}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
