/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { AuthModal } from './components/marketplace/AuthModal';
import { CustomerPortalView } from './components/marketplace/CustomerPortalView';
import { MarketplaceCatalogSection } from './components/marketplace/MarketplaceCatalogSection';
import { MarketplaceCheckoutModal } from './components/marketplace/MarketplaceCheckoutModal';
import { MarketplaceFooter } from './components/marketplace/MarketplaceFooter';
import { MarketplaceHeader } from './components/marketplace/MarketplaceHeader';
import { MarketplaceHeroAndShops } from './components/marketplace/MarketplaceHeroAndShops';
import { MarketplaceQuickViewModal } from './components/marketplace/MarketplaceQuickViewModal';
import { ShopGroupedCartDrawer } from './components/marketplace/ShopGroupedCartDrawer';
import { SuperAdminPortalView } from './components/marketplace/SuperAdminPortalView';
import { VendorPortalView } from './components/marketplace/VendorPortalView';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_MARKETPLACE_CATEGORIES,
  INITIAL_MARKETPLACE_ORDERS,
  INITIAL_MARKETPLACE_PRODUCTS,
  INITIAL_MARKETPLACE_USERS,
  INITIAL_VENDOR_SHOPS,
} from './data/marketplaceSeed';
import type {
  AuditLogEntry,
  CartLine,
  MarketplaceCategory,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceUser,
  StorefrontFilterState,
  UserRole,
  VendorApprovalStatus,
  VendorFulfillmentStatus,
  VendorShop,
} from './types/marketplace';
import {
  DEFAULT_STOREFRONT_FILTERS,
  filterMarketplaceProducts,
  getStorefrontVisibleProducts,
  groupCartByShop,
  updateOrderVendorFulfillment,
  upsertCartLine,
} from './utils/marketplaceLogic';

const LS_KEYS = {
  categories: 'satuibazar_mv_categories_v1',
  shops: 'satuibazar_mv_shops_v1',
  products: 'satuibazar_mv_products_v1',
  users: 'satuibazar_mv_users_v1',
  orders: 'satuibazar_mv_orders_v1',
  logs: 'satuibazar_mv_logs_v1',
  carts: 'satuibazar_mv_carts_v1',
  sessionUserId: 'satuibazar_mv_session_uid_v1',
  pincode: 'satuibazar_mv_pincode_v1',
} as const;

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  // Persistent Multi-Vendor Platform State in localStorage
  const [categories, setCategories] = useState<MarketplaceCategory[]>(() =>
    readLocalJson(LS_KEYS.categories, INITIAL_MARKETPLACE_CATEGORIES)
  );
  const [shops, setShops] = useState<VendorShop[]>(() =>
    readLocalJson(LS_KEYS.shops, INITIAL_VENDOR_SHOPS)
  );
  const [products, setProducts] = useState<MarketplaceProduct[]>(() =>
    readLocalJson(LS_KEYS.products, INITIAL_MARKETPLACE_PRODUCTS)
  );
  const [users, setUsers] = useState<MarketplaceUser[]>(() =>
    readLocalJson(LS_KEYS.users, INITIAL_MARKETPLACE_USERS)
  );
  const [orders, setOrders] = useState<MarketplaceOrder[]>(() =>
    readLocalJson(LS_KEYS.orders, INITIAL_MARKETPLACE_ORDERS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    readLocalJson(LS_KEYS.logs, INITIAL_AUDIT_LOGS)
  );
  const [cartsByOwner, setCartsByOwner] = useState<Record<string, CartLine[]>>(() =>
    readLocalJson(LS_KEYS.carts, {})
  );
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    readLocalJson<string | null>(LS_KEYS.sessionUserId, null)
  );
  const [selectedPincode, setSelectedPincode] = useState<string>(() =>
    readLocalJson(LS_KEYS.pincode, '742405')
  );

  // UI Navigation & Modal State
  const [activeView, setActiveView] = useState<'storefront' | 'portal'>('storefront');
  const [filters, setFilters] = useState<StorefrontFilterState>(
    DEFAULT_STOREFRONT_FILTERS
  );
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<MarketplaceProduct | null>(
    null
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<{
    open: boolean;
    role: UserRole;
    mode: 'login' | 'register';
  }>({ open: false, role: 'customer', mode: 'login' });

  // Sync changes to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEYS.categories, JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEYS.shops, JSON.stringify(shops));
    } catch {}
  }, [shops]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEYS.products, JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEYS.users, JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEYS.orders, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEYS.logs, JSON.stringify(auditLogs));
    } catch {}
  }, [auditLogs]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEYS.carts, JSON.stringify(cartsByOwner));
    } catch {}
  }, [cartsByOwner]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LS_KEYS.sessionUserId,
        JSON.stringify(currentUserId)
      );
    } catch {}
  }, [currentUserId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEYS.pincode, JSON.stringify(selectedPincode));
    } catch {}
  }, [selectedPincode]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || null,
    [users, currentUserId]
  );

  // Strict per-account cart namespace so Customer A never sees Customer B's cart
  const cartNamespaceKey =
    currentUser?.role === 'customer' ? `cust:${currentUser.id}` : 'guest';
  const activeCart = cartsByOwner[cartNamespaceKey] || [];

  const visibleStorefrontProducts = useMemo(
    () => getStorefrontVisibleProducts(products, shops),
    [products, shops]
  );

  const filteredProducts = useMemo(
    () => filterMarketplaceProducts(products, shops, filters),
    [products, shops, filters]
  );

  const cartSummary = useMemo(
    () => groupCartByShop(activeCart, products, shops, categories),
    [activeCart, products, shops, categories]
  );

  function appendAuditLog(
    action: string,
    targetSummary: string,
    actorOverride?: MarketplaceUser | null
  ) {
    const actor = actorOverride !== undefined ? actorOverride : currentUser;
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      timestamp: new Date().toLocaleString('en-IN', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      actorId: actor?.id || 'guest',
      actorName: actor?.fullName || 'Guest Shopper',
      actorRole: actor?.role || 'guest',
      action,
      targetSummary,
    };
    setAuditLogs((prev) => [entry, ...prev]);
  }

  function handleUpdateCartQuantity(
    product: MarketplaceProduct,
    nextQuantity: number
  ) {
    setCartsByOwner((prev) => ({
      ...prev,
      [cartNamespaceKey]: upsertCartLine(
        prev[cartNamespaceKey] || [],
        product,
        nextQuantity
      ),
    }));
  }

  function handleLoginSuccess(user: MarketplaceUser) {
    // If logging in as a customer and guest cart had items while customer cart is empty, carry over guest cart
    if (user.role === 'customer') {
      const custKey = `cust:${user.id}`;
      setCartsByOwner((prev) => {
        const guestItems = prev.guest || [];
        const existingCustItems = prev[custKey] || [];
        if (guestItems.length > 0 && existingCustItems.length === 0) {
          return { ...prev, [custKey]: guestItems, guest: [] };
        }
        return prev;
      });
      setSelectedPincode(user.pincode || '742405');
      setActiveView('portal');
    } else {
      setActiveView('portal');
    }

    setCurrentUserId(user.id);
    appendAuditLog('USER_SESSION_LOGIN', `Signed into ${user.role.toUpperCase()} portal`, user);
  }

  function handleRegisterCustomer(newUser: MarketplaceUser) {
    setUsers((prev) => [...prev, newUser]);
    const custKey = `cust:${newUser.id}`;
    setCartsByOwner((prev) => ({
      ...prev,
      [custKey]: prev.guest || [],
      guest: [],
    }));
    setCurrentUserId(newUser.id);
    setSelectedPincode(newUser.pincode);
    setActiveView('portal');
    appendAuditLog(
      'CUSTOMER_REGISTERED',
      `Registered new customer account (${newUser.email})`,
      newUser
    );
  }

  function handleRegisterVendor(newUser: MarketplaceUser, newShop: VendorShop) {
    setShops((prev) => [newShop, ...prev]);
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setActiveView('portal');
    appendAuditLog(
      'VENDOR_SHOP_ONBOARDED',
      `Onboarded shop "${newShop.name}" (${newShop.primaryCategory}) — awaiting Super Admin approval`,
      newUser
    );
  }

  function handleLogout() {
    if (currentUser) {
      appendAuditLog('USER_SESSION_LOGOUT', `Signed out of ${currentUser.role} session`);
    }
    setCurrentUserId(null);
    setActiveView('storefront');
  }

  function handleCompleteOrder(newOrder: MarketplaceOrder) {
    // Deduct stock atomically across purchased products
    const qtyByProd = new Map<string, number>();
    for (const vb of newOrder.vendorBreakdowns) {
      for (const line of vb.items) {
        qtyByProd.set(
          line.productId,
          (qtyByProd.get(line.productId) || 0) + line.quantity
        );
      }
    }

    setProducts((prev) =>
      prev.map((prod) => {
        const bought = qtyByProd.get(prod.id);
        if (!bought) return prod;
        return { ...prod, stock: Math.max(0, prod.stock - bought) };
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    setCartsByOwner((prev) => ({ ...prev, [cartNamespaceKey]: [] }));

    appendAuditLog(
      'MULTI_VENDOR_ORDER_PLACED',
      `Order ${newOrder.orderId} placed across ${newOrder.vendorBreakdowns.length} shop(s) totaling ₹${newOrder.grandTotal} (${newOrder.paymentMethod.toUpperCase()})`
    );
  }

  // Tier 1 Customer Profile Update
  function handleUpdateCustomerProfile(partial: Partial<MarketplaceUser>) {
    if (!currentUser || currentUser.role !== 'customer') return;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...partial } : u))
    );
    if (partial.pincode) {
      setSelectedPincode(partial.pincode);
    }
    appendAuditLog('CUSTOMER_PROFILE_UPDATED', 'Updated customer profile & delivery address');
  }

  // Tier 2 Vendor Inventory CRUD (Strictly guarded by currentUser.shopId)
  function handleVendorCreateProduct(newProd: MarketplaceProduct) {
    if (!currentUser || currentUser.role !== 'vendor' || currentUser.shopId !== newProd.shopId) {
      return;
    }
    setProducts((prev) => [newProd, ...prev]);
    appendAuditLog(
      'VENDOR_PRODUCT_CREATED',
      `Added "${newProd.title}" (₹${newProd.price}) to ${newProd.shopName}`
    );
  }

  function handleVendorUpdateProduct(
    productId: string,
    partial: Partial<MarketplaceProduct>
  ) {
    if (!currentUser || currentUser.role !== 'vendor' || !currentUser.shopId) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId && p.shopId === currentUser.shopId
          ? { ...p, ...partial }
          : p
      )
    );
    appendAuditLog(
      'VENDOR_PRODUCT_UPDATED',
      `Updated inventory listing (${productId}) in shop ${currentUser.shopId}`
    );
  }

  function handleVendorDeleteProduct(productId: string) {
    if (!currentUser || currentUser.role !== 'vendor' || !currentUser.shopId) return;
    const target = products.find(
      (p) => p.id === productId && p.shopId === currentUser.shopId
    );
    if (!target) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    appendAuditLog(
      'VENDOR_PRODUCT_DELETED',
      `Removed "${target.title}" from ${target.shopName}`
    );
  }

  function handleVendorOrderStatusChange(
    orderId: string,
    shopId: string,
    nextStatus: VendorFulfillmentStatus
  ) {
    setOrders((prev) =>
      updateOrderVendorFulfillment(prev, orderId, shopId, nextStatus, currentUser)
    );
    appendAuditLog(
      'VENDOR_FULFILLMENT_UPDATED',
      `Updated order ${orderId} sub-shipment for ${shopId} to "${nextStatus}"`
    );
  }

  // Tier 3 Super Admin Governance Handlers
  function handleAdminUpdateShopApproval(
    shopId: string,
    status: VendorApprovalStatus
  ) {
    if (currentUser?.role !== 'admin') return;
    const targetShop = shops.find((s) => s.id === shopId);
    setShops((prev) =>
      prev.map((s) => (s.id === shopId ? { ...s, approvalStatus: status } : s))
    );
    appendAuditLog(
      'ADMIN_SHOP_STATUS_CHANGED',
      `Set vendor "${targetShop?.name || shopId}" status to ${status.toUpperCase()}`
    );
  }

  function handleAdminAddCategory(newCategory: MarketplaceCategory) {
    if (currentUser?.role !== 'admin') return;
    setCategories((prev) => [...prev, newCategory]);
    appendAuditLog(
      'ADMIN_CATEGORY_ADDED',
      `Created dynamic category "${newCategory.name}"`
    );
  }

  function handleAdminUpdateCategory(
    categoryId: string,
    partial: Partial<MarketplaceCategory>
  ) {
    if (currentUser?.role !== 'admin') return;
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, ...partial } : c))
    );
    appendAuditLog('ADMIN_CATEGORY_UPDATED', `Updated category settings (${categoryId})`);
  }

  function handleAdminDeleteCategory(categoryId: string) {
    if (currentUser?.role !== 'admin') return;
    const target = categories.find((c) => c.id === categoryId);
    if (!target || target.isSystemDefault) return;
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    if (filters.category === target.name) {
      setFilters((prev) => ({ ...prev, category: 'All' }));
    }
    appendAuditLog(
      'ADMIN_CATEGORY_DELETED',
      `Deleted custom category "${target.name}"`
    );
  }

  function handleAdminDeleteProduct(productId: string) {
    if (currentUser?.role !== 'admin') return;
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    appendAuditLog(
      'ADMIN_PRODUCT_REMOVED',
      `Moderated and removed listing "${target?.title || productId}"`
    );
  }

  function handleResetDemoData() {
    if (currentUser?.role !== 'admin') return;
    setCategories(INITIAL_MARKETPLACE_CATEGORIES);
    setShops(INITIAL_VENDOR_SHOPS);
    setProducts(INITIAL_MARKETPLACE_PRODUCTS);
    setUsers(INITIAL_MARKETPLACE_USERS);
    setOrders(INITIAL_MARKETPLACE_ORDERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCartsByOwner({});
  }

  const quickViewVendorShop = quickViewProduct
    ? shops.find((s) => s.id === quickViewProduct.shopId)
    : undefined;

  const quickViewQtyInCart = quickViewProduct
    ? activeCart.find((c) => c.productId === quickViewProduct.id)?.quantity || 0
    : 0;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900">
      <MarketplaceHeader
        activeView={activeView}
        onSwitchView={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        categories={categories}
        shops={shops}
        products={products}
        selectedCategory={filters.category}
        onSelectCategory={(categoryName) =>
          setFilters((prev) => ({ ...prev, category: categoryName }))
        }
        onSelectShop={(shopId) =>
          setFilters((prev) => ({ ...prev, shopId }))
        }
        onQuickViewProduct={(prod) => setQuickViewProduct(prod)}
        searchQuery={filters.searchQuery}
        onSearchChange={(val) =>
          setFilters((prev) => ({ ...prev, searchQuery: val }))
        }
        selectedPincode={selectedPincode}
        onSelectPincode={setSelectedPincode}
        cartItemCount={cartSummary.totalItemCount}
        onOpenCart={() => setIsCartOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() =>
          setAuthModalState({ open: true, role: 'customer', mode: 'login' })
        }
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activeView === 'portal' && currentUser ? (
          <>
            {currentUser.role === 'customer' && (
              <CustomerPortalView
                currentUser={currentUser}
                allOrders={orders}
                onUpdateProfile={handleUpdateCustomerProfile}
                onBackToStorefront={() => setActiveView('storefront')}
              />
            )}

            {currentUser.role === 'vendor' && (
              <VendorPortalView
                currentUser={currentUser}
                vendorShop={shops.find((s) => s.id === currentUser.shopId)}
                categories={categories}
                allProducts={products}
                allOrders={orders}
                onCreateProduct={handleVendorCreateProduct}
                onUpdateProduct={handleVendorUpdateProduct}
                onDeleteProduct={handleVendorDeleteProduct}
                onUpdateVendorOrderStatus={handleVendorOrderStatusChange}
                onBackToStorefront={() => setActiveView('storefront')}
              />
            )}

            {currentUser.role === 'admin' && (
              <SuperAdminPortalView
                currentUser={currentUser}
                shops={shops}
                categories={categories}
                products={products}
                orders={orders}
                users={users}
                auditLogs={auditLogs}
                onUpdateShopApproval={handleAdminUpdateShopApproval}
                onAddCategory={handleAdminAddCategory}
                onUpdateCategory={handleAdminUpdateCategory}
                onDeleteCategory={handleAdminDeleteCategory}
                onAdminDeleteProduct={handleAdminDeleteProduct}
                onResetDemoData={handleResetDemoData}
                onBackToStorefront={() => setActiveView('storefront')}
              />
            )}
          </>
        ) : (
          <>
            <MarketplaceHeroAndShops
              categories={categories}
              shops={shops}
              selectedCategory={filters.category}
              selectedShopId={filters.shopId}
              onSelectCategory={(categoryName) =>
                setFilters((prev) => ({ ...prev, category: categoryName }))
              }
              onSelectShop={(shopId) =>
                setFilters((prev) => ({ ...prev, shopId }))
              }
              onOpenVendorOnboarding={() =>
                setAuthModalState({ open: true, role: 'vendor', mode: 'register' })
              }
            />

            <MarketplaceCatalogSection
              categories={categories}
              shops={shops}
              filteredProducts={filteredProducts}
              totalVisibleProducts={visibleStorefrontProducts.length}
              filters={filters}
              cart={activeCart}
              isMobileFiltersOpen={isMobileFiltersOpen}
              onSetMobileFiltersOpen={setIsMobileFiltersOpen}
              onUpdateFilters={(partial) =>
                setFilters((prev) => ({ ...prev, ...partial }))
              }
              onResetFilters={() => setFilters(DEFAULT_STOREFRONT_FILTERS)}
              onUpdateCartQuantity={handleUpdateCartQuantity}
              onQuickView={(prod) => setQuickViewProduct(prod)}
            />
          </>
        )}
      </main>

      <MarketplaceFooter
        categories={categories}
        onSelectCategory={(categoryName) => {
          setActiveView('storefront');
          setFilters((prev) => ({ ...prev, category: categoryName }));
        }}
        onOpenAuthForRole={(role, mode = 'login') =>
          setAuthModalState({ open: true, role, mode })
        }
      />

      {/* Interactive Modals & Drawers */}
      <MarketplaceQuickViewModal
        product={quickViewProduct}
        vendorShop={quickViewVendorShop}
        quantityInCart={quickViewQtyInCart}
        onClose={() => setQuickViewProduct(null)}
        onUpdateCartQuantity={handleUpdateCartQuantity}
        onFilterByShop={(shopId) => {
          setActiveView('storefront');
          setFilters((prev) => ({ ...prev, shopId }));
          setTimeout(() => {
            document
              .getElementById('marketplace-catalog')
              ?.scrollIntoView({ behavior: 'smooth' });
          }, 30);
        }}
      />

      <ShopGroupedCartDrawer
        isOpen={isCartOpen}
        summary={cartSummary}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <MarketplaceCheckoutModal
        isOpen={isCheckoutOpen}
        summary={cartSummary}
        shops={shops}
        currentUser={currentUser}
        selectedPincode={selectedPincode}
        onClose={() => setIsCheckoutOpen(false)}
        onCompleteOrder={handleCompleteOrder}
        onOpenCustomerOrders={() => setActiveView('portal')}
      />

      <AuthModal
        isOpen={authModalState.open}
        initialRoleTab={authModalState.role}
        initialMode={authModalState.mode}
        users={users}
        categories={categories}
        onClose={() => setAuthModalState((prev) => ({ ...prev, open: false }))}
        onLoginSuccess={handleLoginSuccess}
        onRegisterCustomer={handleRegisterCustomer}
        onRegisterVendor={handleRegisterVendor}
      />
    </div>
  );
}
