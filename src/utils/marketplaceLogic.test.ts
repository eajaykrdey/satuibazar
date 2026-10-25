import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_MARKETPLACE_CATEGORIES,
  INITIAL_MARKETPLACE_ORDERS,
  INITIAL_MARKETPLACE_PRODUCTS,
  INITIAL_MARKETPLACE_USERS,
  INITIAL_VENDOR_SHOPS,
} from '../data/marketplaceSeed';
import {
  authenticateMarketplaceUser,
  computeSuperAdminMetrics,
  computeVendorAnalytics,
  filterMarketplaceProducts,
  getCustomerScopedOrders,
  getMarketplaceAutocomplete,
  getStorefrontVisibleProducts,
  getVendorScopedOrders,
  getVendorScopedProducts,
  groupCartByShop,
  updateOrderVendorFulfillment,
  upsertCartLine,
  validateCheckoutAddress,
  DEFAULT_STOREFRONT_FILTERS,
} from './marketplaceLogic';

test('storefront hides products from pending or suspended vendor shops', () => {
  const pendingProduct = {
    ...INITIAL_MARKETPLACE_PRODUCTS[0],
    id: 'mp-pending-test',
    shopId: 'shop-nabadwip-crafts', // pending shop in seed
  };
  const all = [...INITIAL_MARKETPLACE_PRODUCTS, pendingProduct];
  const visible = getStorefrontVisibleProducts(all, INITIAL_VENDOR_SHOPS);

  assert.equal(visible.some((p) => p.id === 'mp-pending-test'), false);
  assert.equal(visible.length, INITIAL_MARKETPLACE_PRODUCTS.length);

  // Once approved by Super Admin, product becomes visible immediately
  const approvedShops = INITIAL_VENDOR_SHOPS.map((s) =>
    s.id === 'shop-nabadwip-crafts' ? { ...s, approvalStatus: 'approved' as const } : s
  );
  const visibleAfterApproval = getStorefrontVisibleProducts(all, approvedShops);
  assert.equal(visibleAfterApproval.some((p) => p.id === 'mp-pending-test'), true);
});

test('autocomplete and storefront filter match item name, shop name, and category', () => {
  const byShop = filterMarketplaceProducts(
    INITIAL_MARKETPLACE_PRODUCTS,
    INITIAL_VENDOR_SHOPS,
    { ...DEFAULT_STOREFRONT_FILTERS, shopId: 'shop-bengal-weaves' }
  );
  assert.ok(byShop.length >= 4);
  assert.ok(byShop.every((p) => p.shopName === 'Bengal Weaves'));

  const auto = getMarketplaceAutocomplete(
    'Puja',
    INITIAL_MARKETPLACE_PRODUCTS,
    INITIAL_VENDOR_SHOPS,
    INITIAL_MARKETPLACE_CATEGORIES
  );
  assert.ok(auto.matchedCategories.some((c) => c.name === 'Puja Items'));
  assert.ok(auto.matchedShops.some((s) => s.name.includes('Puja Bhandar')));
  assert.ok(auto.matchedProducts.some((p) => p.category === 'Puja Items'));
});

test('groupCartByShop groups items by vendor shop and calculates per-shop subtotals', () => {
  const handloomItem = INITIAL_MARKETPLACE_PRODUCTS.find((p) => p.id === 'mp-linen-shirt')!;
  const groceryItem = INITIAL_MARKETPLACE_PRODUCTS.find((p) => p.id === 'mp-ghee-doi')!;

  let cart = upsertCartLine([], handloomItem, 1);
  cart = upsertCartLine(cart, groceryItem, 2);

  const summary = groupCartByShop(
    cart,
    INITIAL_MARKETPLACE_PRODUCTS,
    INITIAL_VENDOR_SHOPS,
    INITIAL_MARKETPLACE_CATEGORIES
  );

  assert.equal(summary.distinctShopCount, 2);
  assert.equal(summary.totalItemCount, 3);
  assert.equal(summary.hasPerishableOrFastFood, true);

  const bengalGroup = summary.groups.find((g) => g.shopId === 'shop-bengal-weaves')!;
  const groceryGroup = summary.groups.find((g) => g.shopId === 'shop-express-grocery')!;
  assert.equal(bengalGroup.shopSubtotal, 1699);
  assert.equal(groceryGroup.shopSubtotal, 1240);
  assert.equal(summary.subtotal, 1699 + 1240);
  assert.equal(summary.deliveryFee, 0); // Above ₹999 threshold
});

test('3-tier RBAC enforces strict role login, customer isolation, and vendor isolation', () => {
  const subrata = INITIAL_MARKETPLACE_USERS.find((u) => u.id === 'usr-cust-subrata')!;
  const priya = INITIAL_MARKETPLACE_USERS.find((u) => u.id === 'usr-cust-priya')!;
  const groceryVendor = INITIAL_MARKETPLACE_USERS.find((u) => u.id === 'usr-vendor-grocery')!;
  const bengalVendor = INITIAL_MARKETPLACE_USERS.find((u) => u.id === 'usr-vendor-bengal')!;
  const superAdmin = INITIAL_MARKETPLACE_USERS.find((u) => u.id === 'usr-admin-root')!;

  // Role mismatch rejected
  const wrongRoleAttempt = authenticateMarketplaceUser(
    INITIAL_MARKETPLACE_USERS,
    'admin',
    subrata.email,
    subrata.password
  );
  assert.equal(wrongRoleAttempt.user, null);
  assert.ok(wrongRoleAttempt.error?.includes('Super Admin'));

  // Customer 1 strictly sees ONLY their own order (SB-MV-1041), never Priya's (SB-MV-1040)
  const subrataOrders = getCustomerScopedOrders(INITIAL_MARKETPLACE_ORDERS, subrata);
  assert.equal(subrataOrders.length, 1);
  assert.equal(subrataOrders[0].orderId, 'SB-MV-1041');

  const priyaOrders = getCustomerScopedOrders(INITIAL_MARKETPLACE_ORDERS, priya);
  assert.equal(priyaOrders.length, 1);
  assert.equal(priyaOrders[0].orderId, 'SB-MV-1040');

  // Vendor strictly sees ONLY own inventory & own order breakdown (strips other shops on SB-MV-1041)
  const groceryProducts = getVendorScopedProducts(INITIAL_MARKETPLACE_PRODUCTS, groceryVendor);
  assert.ok(groceryProducts.length >= 2);
  assert.ok(groceryProducts.every((p) => p.shopId === 'shop-express-grocery'));

  const groceryOrders = getVendorScopedOrders(INITIAL_MARKETPLACE_ORDERS, groceryVendor);
  assert.equal(groceryOrders.length, 1);
  assert.equal(groceryOrders[0].orderId, 'SB-MV-1041');
  assert.equal(groceryOrders[0].shopSubtotal, 795); // Only Express Fresh Grocery's ₹795, NOT Satui Electro's ₹1,099!
  assert.equal(groceryOrders[0].items.length, 2);

  // Vendor cannot mutate another vendor's fulfillment status
  const unauthorizedMutation = updateOrderVendorFulfillment(
    INITIAL_MARKETPLACE_ORDERS,
    'SB-MV-1041',
    'shop-satui-electro',
    'Completed',
    bengalVendor
  );
  assert.equal(
    unauthorizedMutation[0].vendorBreakdowns.find((b) => b.shopId === 'shop-satui-electro')
      ?.vendorStatus,
    'Ready for Dispatch'
  );

  // Vendor analytics isolated to own shop
  const bengalStats = computeVendorAnalytics(
    INITIAL_MARKETPLACE_ORDERS,
    INITIAL_MARKETPLACE_PRODUCTS,
    bengalVendor
  );
  assert.equal(bengalStats.grossSales, 3998);

  // Non-admins blocked from Super Admin global metrics; Super Admin receives full audit metrics
  assert.equal(
    computeSuperAdminMetrics(
      INITIAL_MARKETPLACE_ORDERS,
      INITIAL_VENDOR_SHOPS,
      INITIAL_MARKETPLACE_USERS,
      INITIAL_MARKETPLACE_PRODUCTS,
      INITIAL_AUDIT_LOGS,
      groceryVendor
    ),
    null
  );

  const adminMetrics = computeSuperAdminMetrics(
    INITIAL_MARKETPLACE_ORDERS,
    INITIAL_VENDOR_SHOPS,
    INITIAL_MARKETPLACE_USERS,
    INITIAL_MARKETPLACE_PRODUCTS,
    INITIAL_AUDIT_LOGS,
    superAdmin
  );
  assert.ok(adminMetrics);
  assert.equal(adminMetrics.activeApprovedShops, 4);
  assert.equal(adminMetrics.pendingApprovalShops, 1);
  assert.equal(adminMetrics.totalCustomers, 2);
});

test('checkout address validation enforces 10-digit phone and 6-digit pincode', () => {
  const bad = validateCheckoutAddress({
    fullName: 'A',
    phone: '12345',
    email: 'invalid',
    street: 'Rd',
    locality: '',
    city: 'B',
    pincode: '742',
  });
  assert.ok(bad.fullName);
  assert.ok(bad.phone);
  assert.ok(bad.email);
  assert.ok(bad.pincode);
});
