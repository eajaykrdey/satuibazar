import type {
  AdminInventoryItem,
  AdminKpiMetrics,
  AdminOrder,
  CategorySummary,
  DiscountCoupon,
  MarketRateItem,
  MessageLanguage,
  MessageTemplateKind,
  ShopConfiguration,
  WholesaleSupplier,
} from '../types/admin.ts';

export const BASE_HISTORICAL_COMPLETED_ORDERS = 2;

export const INITIAL_SHOP_CONFIG: ShopConfiguration = {
  shopName: 'Satuibazar',
  adminEmail: 'satuibazar@gmail.com',
  hotlinePrimary: '8016841269',
  hotlineSecondary: '9091173191',
  shopOpen: true,
  onlineOrderingActive: true,
  codEnabled: true,
  freeDeliveryMinOrder: 299,
  deliveryRadiusKm: 12,
  dispatchSlaMinutes: 30,
};

export const INITIAL_ADMIN_ORDERS: AdminOrder[] = [
  {
    orderId: 'SB-7424-101',
    status: 'Confirmed',
    customerName: 'Subrata Mondal',
    phone: '9832109876',
    address: 'Salui Uttarpara',
    itemCount: 3,
    itemsDetail: [
      { name: 'Fresh Katla River Fish (Curry Cut)', qtyLabel: '1 kg', lineTotal: 320 },
      { name: 'Jyoti New Harvest Potatoes', qtyLabel: '2 kg', lineTotal: 66 },
      { name: 'Kachi Ghani Pure Mustard Oil', qtyLabel: '1 L Pouch', lineTotal: 180 },
    ],
    total: 566,
    paymentMethod: 'COD',
    placedAt: '08:42 AM',
    isToday: true,
  },
  {
    orderId: 'SB-7424-102',
    status: 'Pending',
    customerName: 'Sk Faruq',
    phone: '9733456789',
    address: 'Shaktipur Link Road',
    itemCount: 2,
    itemsDetail: [
      { name: 'Fresh Rohu River Fish (Steak Cut)', qtyLabel: '1.5 kg', lineTotal: 420 },
      { name: 'Burdwan Miniket Steam Rice', qtyLabel: '10 kg Bag', lineTotal: 492 },
    ],
    total: 912,
    paymentMethod: 'COD',
    placedAt: '09:15 AM',
    isToday: true,
  },
];

export const INITIAL_CATEGORIES: CategorySummary[] = [
  {
    id: 'cat-fish-meat',
    name: 'Fresh Fish, Meat & Eggs',
    slug: 'fresh-fish-meat',
    listedCount: 38,
    active: true,
    marginTarget: '14% – 18%',
  },
  {
    id: 'cat-veg',
    name: 'Farm Vegetables & Potatoes',
    slug: 'vegetables-potatoes',
    listedCount: 54,
    active: true,
    marginTarget: '18% – 24%',
  },
  {
    id: 'cat-oil-staples',
    name: 'Cooking Oils, Rice & Spices',
    slug: 'cooking-oils-staples',
    listedCount: 96,
    active: true,
    marginTarget: '10% – 15%',
  },
  {
    id: 'cat-household',
    name: 'Household & Kitchenware',
    slug: 'household-kitchenware',
    listedCount: 58,
    active: true,
    marginTarget: '20% – 28%',
  },
  {
    id: 'cat-fashion',
    name: 'Bengal Handloom & Apparel',
    slug: 'handloom-fashion',
    listedCount: 32,
    active: true,
    marginTarget: '25% – 35%',
  },
  {
    id: 'cat-electronics',
    name: 'Electronics & Daily Accessories',
    slug: 'electronics',
    listedCount: 25,
    active: true,
    marginTarget: '15% – 22%',
  },
];

export const INITIAL_ADMIN_INVENTORY: AdminInventoryItem[] = [
  {
    id: 'inv-101',
    sku: 'SB-FSH-001',
    name: 'Fresh Katla River Fish (Curry Cut)',
    category: 'Fresh Fish, Meat & Eggs',
    unit: '1 kg',
    price: 320,
    stock: 24,
    reorderLevel: 8,
    supplier: 'Bhagirathi Matsya Arat',
  },
  {
    id: 'inv-102',
    sku: 'SB-FSH-002',
    name: 'Fresh Rohu River Fish (Steak Cut)',
    category: 'Fresh Fish, Meat & Eggs',
    unit: '1 kg',
    price: 280,
    stock: 30,
    reorderLevel: 10,
    supplier: 'Bhagirathi Matsya Arat',
  },
  {
    id: 'inv-103',
    sku: 'SB-VEG-014',
    name: 'Jyoti Potatoes (Sorted Grade-A)',
    category: 'Farm Vegetables & Potatoes',
    unit: '1 kg',
    price: 33,
    stock: 180,
    reorderLevel: 40,
    supplier: 'Berhampore Krishi Mandi',
  },
  {
    id: 'inv-104',
    sku: 'SB-OIL-008',
    name: 'Kachi Ghani Pure Mustard Oil',
    category: 'Cooking Oils, Rice & Spices',
    unit: '1 L Pouch',
    price: 180,
    stock: 64,
    reorderLevel: 15,
    supplier: 'Murshidabad Agro Oils Pvt Ltd',
  },
  {
    id: 'inv-105',
    sku: 'SB-RIC-003',
    name: 'Burdwan Miniket Steam Rice',
    category: 'Cooking Oils, Rice & Spices',
    unit: '10 kg Bag',
    price: 492,
    stock: 42,
    reorderLevel: 10,
    supplier: 'Bengal Grain Wholesale Hub',
  },
  {
    id: 'inv-106',
    sku: 'SB-ELC-101',
    name: 'Studio Pro ANC Wireless Headphones',
    category: 'Electronics & Daily Accessories',
    unit: '1 pc',
    price: 5499,
    stock: 14,
    reorderLevel: 4,
    supplier: 'Eastern Digital Distributors',
  },
  {
    id: 'inv-107',
    sku: 'SB-HLM-201',
    name: 'Bengal Handloom Pure Linen Shirt',
    category: 'Bengal Handloom & Apparel',
    unit: '1 pc',
    price: 1699,
    stock: 18,
    reorderLevel: 5,
    supplier: 'Jiaganj Handloom Weavers Co-op',
  },
  {
    id: 'inv-108',
    sku: 'SB-HSH-302',
    name: 'Artisanal Sage Cast-Iron Dutch Oven (4.5L)',
    category: 'Household & Kitchenware',
    unit: '1 pc',
    price: 3899,
    stock: 8,
    reorderLevel: 3,
    supplier: 'Siliguri Homeware Trade Corp',
  },
];

export const INITIAL_MARKET_RATES: MarketRateItem[] = [
  {
    id: 'mr-1',
    commodity: 'Rohu Fish (Rui)',
    variety: 'Local River · 1.2–1.8 kg size',
    unit: 'per kg',
    wholesaleCost: 235,
    previousRetailRate: 275,
    todayRetailRate: 280,
    inStock: true,
    updatedAt: '06:30 AM',
  },
  {
    id: 'mr-2',
    commodity: 'Katla Fish',
    variety: 'Fresh Morning Catch · Curry Cut',
    unit: 'per kg',
    wholesaleCost: 270,
    previousRetailRate: 325,
    todayRetailRate: 320,
    inStock: true,
    updatedAt: '06:30 AM',
  },
  {
    id: 'mr-3',
    commodity: 'Potatoes (Jyoti)',
    variety: 'Hooghly Cold-Store Sorted',
    unit: 'per kg',
    wholesaleCost: 26,
    previousRetailRate: 32,
    todayRetailRate: 33,
    inStock: true,
    updatedAt: '06:30 AM',
  },
  {
    id: 'mr-4',
    commodity: 'Potatoes (Chandramukhi)',
    variety: 'Premium Thin-Skin',
    unit: 'per kg',
    wholesaleCost: 32,
    previousRetailRate: 40,
    todayRetailRate: 40,
    inStock: true,
    updatedAt: '06:30 AM',
  },
  {
    id: 'mr-5',
    commodity: 'Mustard Cooking Oil',
    variety: 'Cold-Pressed Kachi Ghani',
    unit: 'per 1L pouch',
    wholesaleCost: 158,
    previousRetailRate: 182,
    todayRetailRate: 180,
    inStock: true,
    updatedAt: '06:30 AM',
  },
  {
    id: 'mr-6',
    commodity: 'Refined Soybean Oil',
    variety: 'Fortified Cooking Pouch',
    unit: 'per 1L pouch',
    wholesaleCost: 118,
    previousRetailRate: 135,
    todayRetailRate: 134,
    inStock: true,
    updatedAt: '06:30 AM',
  },
  {
    id: 'mr-7',
    commodity: 'Nasik Red Onion',
    variety: 'Medium Dry Graded',
    unit: 'per kg',
    wholesaleCost: 38,
    previousRetailRate: 48,
    todayRetailRate: 46,
    inStock: true,
    updatedAt: '06:30 AM',
  },
];

export const INITIAL_SUPPLIERS: WholesaleSupplier[] = [
  {
    id: 'sup-1',
    companyName: 'Bhagirathi Matsya Arat',
    categoryFocus: 'Fresh River Fish & Prawns',
    contactPerson: 'Tapas Halder',
    phone: '9732110445',
    location: 'Satui Ghat Market, Murshidabad',
    paymentTerms: 'Daily Cash Settlement (7 AM)',
    lastRestockDate: 'Today, 06:05 AM',
  },
  {
    id: 'sup-2',
    companyName: 'Berhampore Krishi Mandi',
    categoryFocus: 'Potatoes, Onions & Seasonal Produce',
    contactPerson: 'Ranjit Saha',
    phone: '9434229018',
    location: 'NH-12 Wholesale Yard, Berhampore',
    paymentTerms: 'Weekly Ledger (Every Monday)',
    lastRestockDate: 'Today, 05:45 AM',
  },
  {
    id: 'sup-3',
    companyName: 'Murshidabad Agro Oils Pvt Ltd',
    categoryFocus: 'Mustard Oil, Soybean Oil & Spices',
    contactPerson: 'Debashis Ghosh',
    phone: '9830441290',
    location: 'Cossimbazar Industrial Estate',
    paymentTerms: 'Net 15 Days · GST Invoice',
    lastRestockDate: '23 Oct 2026',
  },
  {
    id: 'sup-4',
    companyName: 'Jiaganj Handloom Weavers Co-op',
    categoryFocus: 'Linen Shirts & Mulberry Silk Stoles',
    contactPerson: 'goutam_tantubay@coop.in / 9064112890',
    phone: '9064112890',
    location: 'Jiaganj Loom Cluster, WB',
    paymentTerms: '50% Advance · 50% on Dispatch',
    lastRestockDate: '20 Oct 2026',
  },
];

export const INITIAL_COUPONS: DiscountCoupon[] = [
  {
    code: 'SATUI50',
    description: '₹50 instant off on orders of ₹599 or above',
    discountType: 'flat',
    value: 50,
    minOrder: 599,
    usedCount: 34,
    active: true,
  },
  {
    code: 'FREEDEL299',
    description: 'Zero delivery fee across Satui & Shaktipur above ₹299',
    discountType: 'free_shipping',
    value: 0,
    minOrder: 299,
    usedCount: 118,
    active: true,
  },
  {
    code: 'FESTIVE10',
    description: '10% discount on Bengal handloom & household cookware',
    discountType: 'percent',
    value: 10,
    minOrder: 999,
    usedCount: 19,
    active: true,
  },
];

export function computeAdminKpis(
  orders: AdminOrder[],
  inventory: AdminInventoryItem[],
  categories: CategorySummary[],
  baseHistoricalCompleted = BASE_HISTORICAL_COMPLETED_ORDERS
): AdminKpiMetrics {
  const todayOrders = orders.filter((o) => o.isToday);
  const totalSalesToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersToday = todayOrders.length;

  const pendingDeliveryQueue = orders.filter(
    (o) => o.status !== 'Delivered'
  ).length;

  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
  const totalCompletedOrders = baseHistoricalCompleted + deliveredCount;

  const lowStockAlerts = inventory.filter(
    (item) => item.stock <= item.reorderLevel
  ).length;

  const categorySkuTotal = categories.reduce((sum, c) => sum + c.listedCount, 0);
  // Reflect any newly added inventory items beyond the initial 8 sample rows
  const extraAddedSkus = Math.max(0, inventory.length - INITIAL_ADMIN_INVENTORY.length);
  const totalListedProducts = categorySkuTotal + extraAddedSkus;

  return {
    totalSalesToday,
    totalOrdersToday,
    pendingDeliveryQueue,
    totalCompletedOrders,
    deliveredCount,
    lowStockAlerts,
    totalListedProducts,
  };
}

export function calculateMarketRateDelta(todayRate: number, previousRate: number): {
  diff: number;
  percent: number;
  direction: 'up' | 'down' | 'same';
} {
  const diff = Math.round((todayRate - previousRate) * 100) / 100;
  const percent =
    previousRate > 0 ? Math.round(((todayRate - previousRate) / previousRate) * 1000) / 10 : 0;
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
  return { diff, percent, direction };
}

export function generateOrderMessage(
  order: AdminOrder,
  kind: MessageTemplateKind,
  lang: MessageLanguage = 'en',
  hotline = '8016841269'
): string {
  const paymentNote =
    order.paymentMethod === 'COD'
      ? `₹${order.total.toLocaleString('en-IN')} (Cash on Delivery)`
      : `₹${order.total.toLocaleString('en-IN')} (${order.paymentMethod} Paid)`;

  if (lang === 'bn') {
    if (kind === 'confirmation') {
      return `নমস্কার ${order.customerName}, সাতুই বাজার (Satuibazar)-এ আপনার অর্ডার #${order.orderId} গৃহীত হয়েছে! মোট পণ্য: ${order.itemCount}টি | ঠিকানা: ${order.address} | প্রদেয় বিল: ₹${order.total} (${order.paymentMethod})। প্যাকিং চলছে, শীঘ্রই ডেলিভারি করা হবে। সহায়তা: ${hotline}`;
    }
    if (kind === 'dispatch') {
      return `প্রিয় ${order.customerName}, আপনার অর্ডার #${order.orderId} (${order.itemCount}টি পণ্য) ডেলিভারির জন্য বেরিয়ে গেছে (${order.address})। অনুগ্রহ করে ডেলিভারি রাইডারের জন্য ₹${order.total} (${order.paymentMethod}) প্রস্তুত রাখুন। হটলাইন: ${hotline}`;
    }
    return `ধন্যবাদ ${order.customerName}! আপনার সাতুই বাজার অর্ডার #${order.orderId} সফলভাবে ডেলিভারি সম্পন্ন হয়েছে (₹${order.total})। আবার কেনাকাটার আমন্ত্রণ রইল!`;
  }

  if (kind === 'confirmation') {
    return `Hello ${order.customerName}, your Satuibazar order #${order.orderId} (${order.itemCount} items) for ${order.address} is confirmed! Payable amount: ${paymentNote}. Our team is packing your order for priority dispatch. Helpline: ${hotline}`;
  }

  if (kind === 'dispatch') {
    return `Dispatch Update: Hi ${order.customerName}, your Satuibazar order #${order.orderId} is out for delivery to ${order.address}. Please keep ${paymentNote} ready upon doorstep verification. Helpline: ${hotline}`;
  }

  return `Delivered: Thank you ${order.customerName}! Your Satuibazar order #${order.orderId} (${paymentNote}) has been delivered to ${order.address}. Reply here for any support: ${hotline}`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalizedPhone = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export function generateBloggerSyncSnippet(originUrl: string): string {
  const cleanOrigin = originUrl.replace(/\/$/, '');
  return `<!-- Satuibazar Live Stock & Daily Market Rate Sync for Blogger XML -->
<script>
(function syncSatuibazarInventory() {
  const FEED_URL = "${cleanOrigin}/api/blogger-feed.json";
  fetch(FEED_URL, { cache: "no-store" })
    .then(function (res) { return res.json(); })
    .then(function (feed) {
      if (!feed || !Array.isArray(feed.items)) return;
      const map = new Map(feed.items.map(function (item) { return [item.sku, item]; }));
      document.querySelectorAll("[data-sb-sku]").forEach(function (card) {
        const sku = card.getAttribute("data-sb-sku");
        const live = map.get(sku);
        if (!live) return;
        const priceEl = card.querySelector("[data-sb-price]");
        const btnEl = card.querySelector("[data-sb-add-btn]");
        if (priceEl) priceEl.textContent = "₹" + Number(live.price).toLocaleString("en-IN");
        if (btnEl) {
          btnEl.disabled = !live.inStock || live.stock <= 0;
          btnEl.textContent = live.stock > 0 ? "Add to Bag" : "Out of Stock";
        }
      });
    })
    .catch(function (err) {
      console.warn("Satuibazar live feed fallback active:", err);
    });
})();
</script>`;
}
