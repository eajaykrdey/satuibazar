import type {
  AuditLogEntry,
  CartLine,
  CustomerOrderOverallStatus,
  GroupedCartSummary,
  MarketplaceCategory,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceUser,
  OrderVendorBreakdown,
  ShopCartGroup,
  StorefrontFilterState,
  UserRole,
  VendorFulfillmentStatus,
  VendorScopedOrder,
  VendorShop,
} from '../types/marketplace';

export const DEFAULT_STOREFRONT_FILTERS: StorefrontFilterState = {
  searchQuery: '',
  category: 'All',
  shopId: 'ALL',
  inStockOnly: false,
  maxPrice: 10000,
  sortBy: 'featured',
};

export const FREE_DELIVERY_THRESHOLD = 999;
export const STANDARD_DELIVERY_FEE = 49;

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function computeDiscountPercent(mrp: number, price: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/**
 * Only products belonging to 'approved' vendor shops are visible on the public customer storefront.
 */
export function getStorefrontVisibleProducts(
  products: MarketplaceProduct[],
  shops: VendorShop[]
): MarketplaceProduct[] {
  const approvedShopIds = new Set(
    shops.filter((s) => s.approvalStatus === 'approved').map((s) => s.id)
  );
  return products.filter((p) => approvedShopIds.has(p.shopId));
}

export function filterMarketplaceProducts(
  products: MarketplaceProduct[],
  shops: VendorShop[],
  filters: StorefrontFilterState
): MarketplaceProduct[] {
  const visible = getStorefrontVisibleProducts(products, shops);
  const tokens = filters.searchQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const filtered = visible.filter((item) => {
    if (filters.category !== 'All' && item.category !== filters.category) {
      return false;
    }
    if (filters.shopId !== 'ALL' && item.shopId !== filters.shopId) {
      return false;
    }
    if (filters.inStockOnly && item.stock <= 0) {
      return false;
    }
    if (item.price > filters.maxPrice) {
      return false;
    }
    if (tokens.length > 0) {
      const haystack = `${item.title} ${item.description} ${item.shopName} ${item.category} ${item.sku}`.toLowerCase();
      if (!tokens.every((tok) => haystack.includes(tok))) {
        return false;
      }
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    // Always prioritize in-stock items ahead of out-of-stock items on default featured sort
    if (filters.sortBy === 'featured') {
      const aStock = a.stock > 0 ? 1 : 0;
      const bStock = b.stock > 0 ? 1 : 0;
      if (aStock !== bStock) return bStock - aStock;
      const aFeat = a.isFeatured ? 1 : 0;
      const bFeat = b.isFeatured ? 1 : 0;
      if (aFeat !== bFeat) return bFeat - aFeat;
      return b.reviewCount - a.reviewCount;
    }
    if (filters.sortBy === 'price-asc') {
      return a.price - b.price;
    }
    if (filters.sortBy === 'price-desc') {
      return b.price - a.price;
    }
    if (filters.sortBy === 'rating-desc') {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.reviewCount - a.reviewCount;
    }
    if (filters.sortBy === 'discount-desc') {
      return computeDiscountPercent(b.mrp, b.price) - computeDiscountPercent(a.mrp, a.price);
    }
    return 0;
  });
}

export interface AutocompleteResult {
  matchedCategories: MarketplaceCategory[];
  matchedShops: VendorShop[];
  matchedProducts: MarketplaceProduct[];
}

export function getMarketplaceAutocomplete(
  query: string,
  products: MarketplaceProduct[],
  shops: VendorShop[],
  categories: MarketplaceCategory[]
): AutocompleteResult {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { matchedCategories: [], matchedShops: [], matchedProducts: [] };
  }

  const approvedShops = shops.filter((s) => s.approvalStatus === 'approved');
  const visibleProducts = getStorefrontVisibleProducts(products, shops);

  const matchedCategories = categories
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    )
    .slice(0, 3);

  const matchedShops = approvedShops
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.primaryCategory.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    )
    .slice(0, 3);

  const matchedProducts = visibleProducts
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.shopName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
    .slice(0, 5);

  return { matchedCategories, matchedShops, matchedProducts };
}

/**
 * Cart state reducer: adds/updates/removes quantity, strictly capped at product.stock.
 */
export function upsertCartLine(
  cart: CartLine[],
  product: MarketplaceProduct,
  nextQuantity: number
): CartLine[] {
  if (product.stock <= 0 || nextQuantity <= 0) {
    return cart.filter((line) => line.productId !== product.id);
  }
  const clamped = Math.min(product.stock, Math.floor(nextQuantity));
  const exists = cart.some((line) => line.productId === product.id);
  if (!exists) {
    return [...cart, { productId: product.id, quantity: clamped }];
  }
  return cart.map((line) =>
    line.productId === product.id ? { ...line, quantity: clamped } : line
  );
}

/**
 * Groups cart items by vendor shop and computes per-shop subtotals & overall checkout totals.
 */
export function groupCartByShop(
  cart: CartLine[],
  products: MarketplaceProduct[],
  shops: VendorShop[],
  categories: MarketplaceCategory[]
): GroupedCartSummary {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const shopMap = new Map(shops.map((s) => [s.id, s]));
  const fastCatSet = new Set(
    categories.filter((c) => c.isFastDeliveryEligible).map((c) => c.name)
  );

  const groupMap = new Map<string, ShopCartGroup>();
  let totalItemCount = 0;
  let mrpTotal = 0;
  let subtotal = 0;
  let hasPerishableOrFastFood = false;

  for (const line of cart) {
    const product = productMap.get(line.productId);
    if (!product || product.stock <= 0) continue;
    const shop = shopMap.get(product.shopId);
    if (shop && shop.approvalStatus !== 'approved') continue;

    const qty = Math.min(line.quantity, product.stock);
    if (qty <= 0) continue;

    const lineMrpTotal = product.mrp * qty;
    const lineSubtotal = product.price * qty;

    totalItemCount += qty;
    mrpTotal += lineMrpTotal;
    subtotal += lineSubtotal;

    if (fastCatSet.has(product.category)) {
      hasPerishableOrFastFood = true;
    }

    let group = groupMap.get(product.shopId);
    if (!group) {
      group = {
        shopId: product.shopId,
        shopName: shop?.name || product.shopName,
        shopLocation: shop ? `${shop.address} (${shop.pincode})` : 'Satui Bazar',
        items: [],
        itemCount: 0,
        shopMrpSubtotal: 0,
        shopSubtotal: 0,
      };
      groupMap.set(product.shopId, group);
    }

    group.items.push({
      product,
      quantity: qty,
      lineMrpTotal,
      lineSubtotal,
    });
    group.itemCount += qty;
    group.shopMrpSubtotal += lineMrpTotal;
    group.shopSubtotal += lineSubtotal;
  }

  const groups = Array.from(groupMap.values());
  const deliveryFee =
    subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  const totalSavings = Math.max(0, mrpTotal - subtotal);

  return {
    groups,
    totalItemCount,
    distinctShopCount: groups.length,
    mrpTotal,
    subtotal,
    totalSavings,
    deliveryFee,
    grandTotal: subtotal + deliveryFee,
    hasPerishableOrFastFood,
  };
}

// ============================================================================
// 3-TIER ROLE-BASED AUTHENTICATION & STRICT DATA ISOLATION
// ============================================================================

export function authenticateMarketplaceUser(
  users: MarketplaceUser[],
  role: UserRole,
  identifier: string,
  password: string
): { user: MarketplaceUser | null; error: string | null } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPhone = identifier.replace(/\D/g, '');

  if (!cleanId || !password.trim()) {
    return { user: null, error: 'Please enter both your email/phone and password.' };
  }

  const matched = users.find((u) => {
    const emailMatch = u.email.toLowerCase() === cleanId;
    const phoneMatch = cleanPhone.length >= 10 && u.phone.replace(/\D/g, '') === cleanPhone;
    return emailMatch || phoneMatch;
  });

  if (!matched || matched.password !== password) {
    return { user: null, error: 'Invalid email/phone or password.' };
  }

  if (matched.role !== role) {
    const roleLabel =
      role === 'customer' ? 'Customer' : role === 'vendor' ? 'Shop Owner' : 'Super Admin';
    return {
      user: null,
      error: `This account is not registered under the ${roleLabel} tier. Please switch role tabs.`,
    };
  }

  return { user: matched, error: null };
}

/**
 * TIER 1 ISOLATION: Customers strictly access ONLY their own orders.
 */
export function getCustomerScopedOrders(
  orders: MarketplaceOrder[],
  currentUser: MarketplaceUser | null
): MarketplaceOrder[] {
  if (!currentUser || currentUser.role !== 'customer') {
    return [];
  }
  return orders.filter((order) => order.customerId === currentUser.id);
}

/**
 * TIER 2 ISOLATION (Inventory): Shop Owners strictly access ONLY products owned by their shopId.
 */
export function getVendorScopedProducts(
  products: MarketplaceProduct[],
  currentUser: MarketplaceUser | null
): MarketplaceProduct[] {
  if (!currentUser || currentUser.role !== 'vendor' || !currentUser.shopId) {
    return [];
  }
  return products.filter((p) => p.shopId === currentUser.shopId);
}

/**
 * TIER 2 ISOLATION (Orders): Shop Owners strictly view ONLY sub-orders containing their shop's items.
 * Items, subtotals, commissions, and fulfillment states of other shops on the same multi-vendor order
 * are completely stripped out.
 */
export function getVendorScopedOrders(
  orders: MarketplaceOrder[],
  currentUser: MarketplaceUser | null
): VendorScopedOrder[] {
  if (!currentUser || currentUser.role !== 'vendor' || !currentUser.shopId) {
    return [];
  }

  const targetShopId = currentUser.shopId;
  const scoped: VendorScopedOrder[] = [];

  for (const order of orders) {
    const ownBreakdown = order.vendorBreakdowns.find((vb) => vb.shopId === targetShopId);
    if (!ownBreakdown) continue;

    scoped.push({
      orderId: order.orderId,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryLocality: `${order.deliveryAddress.locality || order.deliveryAddress.street}, ${order.deliveryAddress.city}`,
      deliveryPincode: order.deliveryAddress.pincode,
      deliverySlotLabel: order.deliverySchedule.slotLabel,
      paymentMethod: order.paymentMethod,
      vendorStatus: ownBreakdown.vendorStatus,
      items: ownBreakdown.items.map((item) => ({ ...item })),
      shopSubtotal: ownBreakdown.shopSubtotal,
      platformCommission: ownBreakdown.platformCommission,
      vendorNetEarnings: ownBreakdown.vendorNetEarnings,
    });
  }

  return scoped;
}

export interface VendorAnalyticsSummary {
  totalProducts: number;
  lowStockProducts: number;
  totalShopOrders: number;
  activePendingOrders: number;
  grossSales: number;
  netEarningsTotal: number;
  pendingPayoutAmount: number;
  settledPayoutAmount: number;
}

export function computeVendorAnalytics(
  orders: MarketplaceOrder[],
  products: MarketplaceProduct[],
  currentUser: MarketplaceUser | null
): VendorAnalyticsSummary {
  const ownProducts = getVendorScopedProducts(products, currentUser);
  const ownOrders = getVendorScopedOrders(orders, currentUser);

  let grossSales = 0;
  let netEarningsTotal = 0;
  let pendingPayoutAmount = 0;
  let settledPayoutAmount = 0;
  let activePendingOrders = 0;

  for (const ord of ownOrders) {
    grossSales += ord.shopSubtotal;
    netEarningsTotal += ord.vendorNetEarnings;
    if (ord.vendorStatus === 'Completed') {
      settledPayoutAmount += ord.vendorNetEarnings;
    } else {
      pendingPayoutAmount += ord.vendorNetEarnings;
      activePendingOrders += 1;
    }
  }

  return {
    totalProducts: ownProducts.length,
    lowStockProducts: ownProducts.filter((p) => p.stock <= 5).length,
    totalShopOrders: ownOrders.length,
    activePendingOrders,
    grossSales,
    netEarningsTotal,
    pendingPayoutAmount,
    settledPayoutAmount,
  };
}

/**
 * Derives customer-visible overall order status from per-shop fulfillment stages.
 */
export function deriveOverallCustomerOrderStatus(
  breakdowns: OrderVendorBreakdown[]
): CustomerOrderOverallStatus {
  if (breakdowns.length === 0) return 'Pending';
  if (breakdowns.every((b) => b.vendorStatus === 'Completed')) {
    return 'Completed';
  }
  if (
    breakdowns.some(
      (b) => b.vendorStatus === 'Out for Delivery' || b.vendorStatus === 'Completed'
    )
  ) {
    return 'Out for Delivery';
  }
  if (
    breakdowns.some(
      (b) =>
        b.vendorStatus === 'Accepted' ||
        b.vendorStatus === 'Preparing' ||
        b.vendorStatus === 'Ready for Dispatch'
    )
  ) {
    return 'Processing';
  }
  return 'Pending';
}

/**
 * Updates ONLY the acting Shop Owner's breakdown status inside an order (or allows Admin override).
 */
export function updateOrderVendorFulfillment(
  orders: MarketplaceOrder[],
  orderId: string,
  shopId: string,
  nextStatus: VendorFulfillmentStatus,
  actor: MarketplaceUser | null
): MarketplaceOrder[] {
  if (!actor) return orders;
  if (actor.role === 'vendor' && actor.shopId !== shopId) {
    // Strict RBAC guard: vendor cannot mutate another shop's breakdown
    return orders;
  }
  if (actor.role === 'customer') {
    return orders;
  }

  const stamp = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return orders.map((order) => {
    if (order.orderId !== orderId) return order;
    const updatedBreakdowns = order.vendorBreakdowns.map((vb) =>
      vb.shopId === shopId
        ? { ...vb, vendorStatus: nextStatus, updatedAt: `Updated ${stamp}` }
        : vb
    );
    return {
      ...order,
      vendorBreakdowns: updatedBreakdowns,
      overallStatus: deriveOverallCustomerOrderStatus(updatedBreakdowns),
    };
  });
}

// ============================================================================
// TIER 3 SUPER ADMIN GLOBAL ANALYTICS
// ============================================================================

export interface SuperAdminGlobalMetrics {
  totalGmvSales: number;
  platformCommissionRevenue: number;
  totalOrders: number;
  activeApprovedShops: number;
  pendingApprovalShops: number;
  suspendedShops: number;
  totalCustomers: number;
  totalCatalogItems: number;
  totalAuditEvents: number;
}

export function computeSuperAdminMetrics(
  orders: MarketplaceOrder[],
  shops: VendorShop[],
  users: MarketplaceUser[],
  products: MarketplaceProduct[],
  auditLogs: AuditLogEntry[],
  currentUser: MarketplaceUser | null
): SuperAdminGlobalMetrics | null {
  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  let totalGmvSales = 0;
  let platformCommissionRevenue = 0;

  for (const order of orders) {
    totalGmvSales += order.grandTotal;
    for (const vb of order.vendorBreakdowns) {
      platformCommissionRevenue += vb.platformCommission;
    }
  }

  return {
    totalGmvSales,
    platformCommissionRevenue,
    totalOrders: orders.length,
    activeApprovedShops: shops.filter((s) => s.approvalStatus === 'approved').length,
    pendingApprovalShops: shops.filter((s) => s.approvalStatus === 'pending').length,
    suspendedShops: shops.filter((s) => s.approvalStatus === 'suspended').length,
    totalCustomers: users.filter((u) => u.role === 'customer').length,
    totalCatalogItems: products.length,
    totalAuditEvents: auditLogs.length,
  };
}

// ============================================================================
// CHECKOUT FORM VALIDATION
// ============================================================================

export function validateCheckoutAddress(input: {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  locality: string;
  city: string;
  pincode: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.fullName.trim().length < 2) {
    errors.fullName = 'Enter recipient full name.';
  }
  if (!/^\d{10}$/.test(input.phone.replace(/\D/g, ''))) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = 'Enter a valid email address for order invoice.';
  }
  if (input.street.trim().length < 4) {
    errors.street = 'Enter street, house number, or para landmark.';
  }
  if (input.city.trim().length < 2) {
    errors.city = 'Enter city or subdivision name.';
  }
  if (!/^\d{6}$/.test(input.pincode.trim())) {
    errors.pincode = 'Enter a valid 6-digit delivery pincode.';
  }
  return errors;
}

export function validateCheckoutPayment(
  method: 'cod' | 'upi' | 'card',
  upiId: string,
  cardNumber: string,
  cardExpiry: string,
  cardCvv: string
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (method === 'upi') {
    if (!/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
      errors.upiId = 'Enter a valid UPI ID (e.g. name@okaxis).';
    }
  } else if (method === 'card') {
    if (!/^\d{16}$/.test(cardNumber.replace(/\s+/g, ''))) {
      errors.cardNumber = 'Enter a valid 16-digit card number.';
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) {
      errors.cardExpiry = 'Use MM/YY expiry format.';
    }
    if (!/^\d{3,4}$/.test(cardCvv.trim())) {
      errors.cardCvv = 'Enter 3 or 4 digit CVV.';
    }
  }
  return errors;
}
