export type AdminSectionId =
  | 'overview'
  | 'orders'
  | 'products'
  | 'wholesale'
  | 'categories'
  | 'market-rates'
  | 'coupons'
  | 'config'
  | 'blogger-xml';

export type AdminOrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Packaging'
  | 'Dispatched'
  | 'Delivered';

export type MessageTemplateKind = 'confirmation' | 'dispatch' | 'delivered';

export type MessageLanguage = 'en' | 'bn';

export interface AdminOrderItem {
  name: string;
  qtyLabel: string;
  lineTotal: number;
}

export interface AdminOrder {
  orderId: string;
  status: AdminOrderStatus;
  customerName: string;
  phone: string;
  address: string;
  itemCount: number;
  itemsDetail: AdminOrderItem[];
  total: number;
  paymentMethod: 'COD' | 'UPI' | 'CARD';
  placedAt: string;
  isToday: boolean;
}

export interface AdminInventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  reorderLevel: number;
  supplier: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  listedCount: number;
  active: boolean;
  marginTarget: string;
}

export interface MarketRateItem {
  id: string;
  commodity: string;
  variety: string;
  unit: string;
  wholesaleCost: number;
  previousRetailRate: number;
  todayRetailRate: number;
  inStock: boolean;
  updatedAt: string;
}

export interface WholesaleSupplier {
  id: string;
  companyName: string;
  categoryFocus: string;
  contactPerson: string;
  phone: string;
  location: string;
  paymentTerms: string;
  lastRestockDate: string;
}

export interface DiscountCoupon {
  code: string;
  description: string;
  discountType: 'flat' | 'percent' | 'free_shipping';
  value: number;
  minOrder: number;
  usedCount: number;
  active: boolean;
}

export interface ShopConfiguration {
  shopName: string;
  adminEmail: string;
  hotlinePrimary: string;
  hotlineSecondary: string;
  shopOpen: boolean;
  onlineOrderingActive: boolean;
  codEnabled: boolean;
  freeDeliveryMinOrder: number;
  deliveryRadiusKm: number;
  dispatchSlaMinutes: number;
}

export interface AdminKpiMetrics {
  totalSalesToday: number;
  totalOrdersToday: number;
  pendingDeliveryQueue: number;
  totalCompletedOrders: number;
  deliveredCount: number;
  lowStockAlerts: number;
  totalListedProducts: number;
}
