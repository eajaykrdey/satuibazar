import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_ADMIN_INVENTORY,
  INITIAL_ADMIN_ORDERS,
  INITIAL_CATEGORIES,
  buildWhatsAppLink,
  calculateMarketRateDelta,
  computeAdminKpis,
  generateBloggerSyncSnippet,
  generateOrderMessage,
} from './adminLogic';

test('computeAdminKpis matches exact Satuibazar Admin Master Hub baseline figures', () => {
  const kpis = computeAdminKpis(
    INITIAL_ADMIN_ORDERS,
    INITIAL_ADMIN_INVENTORY,
    INITIAL_CATEGORIES
  );

  assert.equal(kpis.totalSalesToday, 1478); // 566 + 912
  assert.equal(kpis.totalOrdersToday, 2);
  assert.equal(kpis.pendingDeliveryQueue, 2);
  assert.equal(kpis.totalCompletedOrders, 2);
  assert.equal(kpis.deliveredCount, 0);
  assert.equal(kpis.lowStockAlerts, 0);
  assert.equal(kpis.totalListedProducts, 303);
});

test('computeAdminKpis updates delivery queue and low stock alerts dynamically', () => {
  const updatedOrders = INITIAL_ADMIN_ORDERS.map((o) =>
    o.orderId === 'SB-7424-101' ? { ...o, status: 'Delivered' as const } : o
  );
  const updatedInventory = INITIAL_ADMIN_INVENTORY.map((item, idx) =>
    idx === 0 ? { ...item, stock: 2 } : item
  );

  const kpis = computeAdminKpis(updatedOrders, updatedInventory, INITIAL_CATEGORIES);
  assert.equal(kpis.pendingDeliveryQueue, 1);
  assert.equal(kpis.deliveredCount, 1);
  assert.equal(kpis.totalCompletedOrders, 3);
  assert.equal(kpis.lowStockAlerts, 1);
});

test('generateOrderMessage interpolates customer, address, COD total, and order ID accurately', () => {
  const order1 = INITIAL_ADMIN_ORDERS[0]; // Subrata Mondal, SB-7424-101, ₹566
  const enConfirm = generateOrderMessage(order1, 'confirmation', 'en');
  assert.ok(enConfirm.includes('Subrata Mondal'));
  assert.ok(enConfirm.includes('SB-7424-101'));
  assert.ok(enConfirm.includes('Salui Uttarpara'));
  assert.ok(enConfirm.includes('566'));

  const bnDispatch = generateOrderMessage(INITIAL_ADMIN_ORDERS[1], 'dispatch', 'bn');
  assert.ok(bnDispatch.includes('Sk Faruq'));
  assert.ok(bnDispatch.includes('SB-7424-102'));
  assert.ok(bnDispatch.includes('912'));

  const waUrl = buildWhatsAppLink('9832109876', enConfirm);
  assert.ok(waUrl.startsWith('https://wa.me/919832109876?text='));
});

test('calculateMarketRateDelta and generateBloggerSyncSnippet return expected outputs', () => {
  const up = calculateMarketRateDelta(280, 275);
  assert.equal(up.diff, 5);
  assert.equal(up.direction, 'up');

  const down = calculateMarketRateDelta(320, 325);
  assert.equal(down.diff, -5);
  assert.equal(down.direction, 'down');

  const snippet = generateBloggerSyncSnippet('https://satuibazar.example.com/');
  assert.ok(snippet.includes('https://satuibazar.example.com/api/blogger-feed.json'));
  assert.ok(snippet.includes('data-sb-sku'));
});
