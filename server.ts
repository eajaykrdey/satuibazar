import express from 'express';
import path from 'node:path';
import { INITIAL_PRODUCTS } from './src/data/catalog.ts';
import type { OrderRecord, Product } from './src/types/shop.ts';
import {
  INITIAL_ADMIN_INVENTORY,
  INITIAL_ADMIN_ORDERS,
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_MARKET_RATES,
  INITIAL_SHOP_CONFIG,
  INITIAL_SUPPLIERS,
} from './src/utils/adminLogic.ts';
import type {
  AdminInventoryItem,
  AdminOrder,
  AdminOrderStatus,
  CategorySummary,
  DiscountCoupon,
  MarketRateItem,
  ShopConfiguration,
  WholesaleSupplier,
} from './src/types/admin.ts';

const PORT = 3000;

// In-memory store initialized with our curated catalog & Admin Master Hub baseline
const catalogState: Product[] = INITIAL_PRODUCTS.map((item) => ({ ...item }));
const ordersState: OrderRecord[] = [];
const newsletterSubscribers = new Set<string>();
const contactInquiries: Array<{
  ticketId: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}> = [];

const adminOrdersState: AdminOrder[] = INITIAL_ADMIN_ORDERS.map((o) => ({
  ...o,
  itemsDetail: o.itemsDetail.map((i) => ({ ...i })),
}));
const adminInventoryState: AdminInventoryItem[] = INITIAL_ADMIN_INVENTORY.map((i) => ({
  ...i,
}));
const adminCategoriesState: CategorySummary[] = INITIAL_CATEGORIES.map((c) => ({ ...c }));
const adminMarketRatesState: MarketRateItem[] = INITIAL_MARKET_RATES.map((r) => ({ ...r }));
const adminSuppliersState: WholesaleSupplier[] = INITIAL_SUPPLIERS.map((s) => ({ ...s }));
const adminCouponsState: DiscountCoupon[] = INITIAL_COUPONS.map((c) => ({ ...c }));
let shopConfigState: ShopConfiguration = { ...INITIAL_SHOP_CONFIG };

async function startServer() {
  const app = express();
  app.use(express.json());

  // GET /api/products — fetch catalog with live stock counts
  app.get('/api/products', (_req, res) => {
    res.json({ products: catalogState });
  });

  // GET /api/orders — fetch confirmed orders
  app.get('/api/orders', (_req, res) => {
    res.json({ orders: ordersState });
  });

  // POST /api/orders — validate & place order, decrementing live stock
  app.post('/api/orders', (req, res) => {
    const { customer, shipping, paymentMethod, paymentSummary, items } = req.body ?? {};

    if (
      !customer?.fullName ||
      !customer?.email ||
      !customer?.phone ||
      !shipping?.streetAddress ||
      !shipping?.city ||
      !shipping?.postalCode ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      res.status(400).json({ error: 'Incomplete customer, shipping, or cart details.' });
      return;
    }

    // Verify stock availability for all requested items first
    const resolvedLines: OrderRecord['items'] = [];
    let subtotal = 0;
    let originalSubtotal = 0;

    for (const reqItem of items) {
      const product = catalogState.find((p) => p.id === reqItem.productId);
      const qty = Number(reqItem.quantity);
      if (!product || !Number.isInteger(qty) || qty <= 0) {
        res.status(400).json({ error: 'Invalid product or quantity in order.' });
        return;
      }
      if (product.stock < qty) {
        res.status(409).json({
          error: `Insufficient stock for "${product.title}" (${product.stock} available).`,
        });
        return;
      }

      const lineSubtotal = product.price * qty;
      subtotal += lineSubtotal;
      originalSubtotal += product.originalPrice * qty;
      resolvedLines.push({
        productId: product.id,
        title: product.title,
        quantity: qty,
        unitPrice: product.price,
        lineSubtotal,
      });
    }

    // Deduct stock atomically
    for (const line of resolvedLines) {
      const product = catalogState.find((p) => p.id === line.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - line.quantity);
      }
    }

    const shippingCost =
      shipping.shippingSpeed === 'express' ? 199 : subtotal >= 1999 ? 0 : 99;
    const totalSavings = Math.max(0, originalSubtotal - subtotal);
    const total = subtotal + shippingCost;

    const orderNumber = 1042 + ordersState.length;
    const orderRecord: OrderRecord = {
      orderId: `SB-2026-${orderNumber}`,
      createdAt: new Date().toISOString(),
      customer: {
        fullName: String(customer.fullName).trim(),
        email: String(customer.email).trim(),
        phone: String(customer.phone).trim(),
      },
      shipping: {
        streetAddress: String(shipping.streetAddress).trim(),
        locality: String(shipping.locality || '').trim(),
        city: String(shipping.city).trim(),
        postalCode: String(shipping.postalCode).trim(),
        shippingSpeed: shipping.shippingSpeed === 'express' ? 'express' : 'standard',
      },
      paymentMethod:
        paymentMethod === 'upi' || paymentMethod === 'card' ? paymentMethod : 'cod',
      paymentSummary: String(paymentSummary || 'Cash on Delivery'),
      items: resolvedLines,
      subtotal,
      shippingCost,
      totalSavings,
      total,
      status: 'Confirmed',
    };

    ordersState.unshift(orderRecord);

    // Sync storefront order directly into Admin Master Hub Recent Order Queue
    const totalUnits = resolvedLines.reduce((acc, l) => acc + l.quantity, 0);
    adminOrdersState.unshift({
      orderId: `SB-7424-${103 + ordersState.length - 1}`,
      status: 'Pending',
      customerName: orderRecord.customer.fullName,
      phone: orderRecord.customer.phone,
      address: `${orderRecord.shipping.locality || orderRecord.shipping.streetAddress}`,
      itemCount: totalUnits,
      itemsDetail: resolvedLines.map((l) => ({
        name: l.title,
        qtyLabel: `${l.quantity} pc`,
        lineTotal: l.lineSubtotal,
      })),
      total: orderRecord.total,
      paymentMethod:
        orderRecord.paymentMethod === 'upi'
          ? 'UPI'
          : orderRecord.paymentMethod === 'card'
          ? 'CARD'
          : 'COD',
      placedAt: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isToday: true,
    });

    res.status(201).json({ order: orderRecord, updatedProducts: catalogState });
  });

  // POST /api/newsletter — subscribe email
  app.post('/api/newsletter', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const alreadySubscribed = newsletterSubscribers.has(email);
    newsletterSubscribers.add(email);
    res.status(200).json({
      message: alreadySubscribed
        ? 'You are already subscribed to Satuibazar dispatches.'
        : 'Subscribed! Weekly deal dispatches will arrive in your inbox.',
    });
  });

  // POST /api/contact — submit customer support message
  app.post('/api/contact', (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const message = String(req.body?.message || '').trim();

    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
      res.status(400).json({
        error: 'Please provide your name, a valid email, and a message (at least 10 characters).',
      });
      return;
    }

    const ticketId = `TKT-${2040 + contactInquiries.length}`;
    contactInquiries.push({
      ticketId,
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      ticketId,
      message: `Inquiry ${ticketId} received. Our Satui support desk responds within 4 business hours.`,
    });
  });

  // =========================================================================
  // SATUIBAZAR ADMIN MASTER HUB API ROUTES & LIVE BLOGGER XML FEED
  // =========================================================================

  app.get('/api/admin/state', (_req, res) => {
    res.json({
      orders: adminOrdersState,
      inventory: adminInventoryState,
      categories: adminCategoriesState,
      marketRates: adminMarketRatesState,
      suppliers: adminSuppliersState,
      coupons: adminCouponsState,
      config: shopConfigState,
    });
  });

  app.patch('/api/admin/orders/:orderId', (req, res) => {
    const { orderId } = req.params;
    const nextStatus = req.body?.status as AdminOrderStatus;
    const allowed: AdminOrderStatus[] = [
      'Pending',
      'Confirmed',
      'Packaging',
      'Dispatched',
      'Delivered',
    ];
    if (!allowed.includes(nextStatus)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    const found = adminOrdersState.find((o) => o.orderId === orderId);
    if (!found) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    found.status = nextStatus;
    res.json({ order: found, orders: adminOrdersState });
  });

  app.post('/api/admin/market-rates', (req, res) => {
    const incoming = req.body?.rates;
    if (!Array.isArray(incoming)) {
      res.status(400).json({ error: 'Expected array of market rates.' });
      return;
    }
    const stamp = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    for (const update of incoming) {
      const target = adminMarketRatesState.find((r) => r.id === update.id);
      if (target) {
        if (typeof update.todayRetailRate === 'number' && update.todayRetailRate > 0) {
          target.previousRetailRate = target.todayRetailRate;
          target.todayRetailRate = update.todayRetailRate;
        }
        if (typeof update.wholesaleCost === 'number' && update.wholesaleCost > 0) {
          target.wholesaleCost = update.wholesaleCost;
        }
        if (typeof update.inStock === 'boolean') {
          target.inStock = update.inStock;
        }
        target.updatedAt = stamp;
      }
    }

    res.json({
      marketRates: adminMarketRatesState,
      publishedAt: stamp,
    });
  });

  app.patch('/api/admin/config', (req, res) => {
    shopConfigState = {
      ...shopConfigState,
      ...req.body,
    };
    res.json({ config: shopConfigState });
  });

  // Live CORS-enabled JSON inventory & daily market feed for Blogger XML Theme sync
  app.get('/api/blogger-feed.json', (_req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      shop: shopConfigState.shopName,
      shopOpen: shopConfigState.shopOpen,
      onlineOrderingActive: shopConfigState.onlineOrderingActive,
      generatedAt: new Date().toISOString(),
      totalListedProducts:
        adminCategoriesState.reduce((s, c) => s + c.listedCount, 0) +
        Math.max(0, adminInventoryState.length - INITIAL_ADMIN_INVENTORY.length),
      marketRates: adminMarketRatesState,
      items: adminInventoryState.map((item) => ({
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        price: item.price,
        stock: item.stock,
        inStock: item.stock > 0,
      })),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Satuibazar full-stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
