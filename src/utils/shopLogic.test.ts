import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PRODUCTS } from '../data/catalog';
import {
  DEFAULT_FILTERS,
  addToCartState,
  calculateDiscountPercent,
  calculateOrderTotals,
  filterAndSortProducts,
  getSearchSuggestions,
  removeFromCartState,
  updateCartQuantityState,
  validateCustomerInfo,
  validatePaymentDetails,
  validateShippingDetails,
} from './shopLogic';

test('calculateDiscountPercent computes rounded discount accurately', () => {
  assert.equal(calculateDiscountPercent(5499, 7999), 31);
  assert.equal(calculateDiscountPercent(1499, 1999), 25);
  assert.equal(calculateDiscountPercent(2000, 2000), 0);
});

test('default popularity sort prioritizes in-stock items ahead of sold-out items', () => {
  const defaultSorted = filterAndSortProducts(INITIAL_PRODUCTS, DEFAULT_FILTERS);
  assert.ok(defaultSorted[0].stock > 0);
  assert.equal(defaultSorted[defaultSorted.length - 1].id, 'prod-silk-stole');
});

test('filterAndSortProducts filters by category, stock, price, rating, and sorts correctly', () => {
  const electronicsInStock = filterAndSortProducts(INITIAL_PRODUCTS, {
    ...DEFAULT_FILTERS,
    category: 'Electronics',
    inStockOnly: true,
    sortBy: 'price-asc',
  });

  assert.equal(electronicsInStock.length, 4);
  assert.equal(electronicsInStock[0].id, 'prod-speaker');
  assert.ok(electronicsInStock[0].price <= electronicsInStock[1].price);

  const fashionAvailable = filterAndSortProducts(INITIAL_PRODUCTS, {
    ...DEFAULT_FILTERS,
    category: 'Fashion',
    inStockOnly: true,
  });
  // Silk stole is out of stock (stock: 0), so 3 of 4 Fashion items remain
  assert.equal(fashionAvailable.length, 3);
  assert.equal(
    fashionAvailable.some((item) => item.id === 'prod-silk-stole'),
    false
  );

  const budgetHighRated = filterAndSortProducts(INITIAL_PRODUCTS, {
    ...DEFAULT_FILTERS,
    maxPrice: 3200,
    minRating: 4.8,
    inStockOnly: true,
    sortBy: 'price-desc',
  });
  assert.ok(budgetHighRated.length >= 2);
  for (const item of budgetHighRated) {
    assert.ok(item.price <= 3200);
    assert.ok(item.rating >= 4.8);
    assert.ok(item.stock > 0);
  }
});

test('filterAndSortProducts supports live multi-token search and dealsOnly toggle', () => {
  const searchMatches = filterAndSortProducts(INITIAL_PRODUCTS, {
    ...DEFAULT_FILTERS,
    searchQuery: 'wireless keyboard',
  });
  assert.equal(searchMatches.length, 1);
  assert.equal(searchMatches[0].id, 'prod-keyboard');

  const deals = filterAndSortProducts(INITIAL_PRODUCTS, {
    ...DEFAULT_FILTERS,
    dealsOnly: true,
  });
  assert.ok(deals.length >= 6);
  for (const deal of deals) {
    assert.ok(calculateDiscountPercent(deal.price, deal.originalPrice) >= 25);
  }
});

test('getSearchSuggestions returns category and product auto-suggestions', () => {
  const suggestions = getSearchSuggestions(INITIAL_PRODUCTS, 'elect', 5);
  assert.ok(suggestions.some((s) => s.type === 'category' && s.label === 'Electronics'));
  assert.ok(suggestions.some((s) => s.type === 'product'));
  assert.deepEqual(getSearchSuggestions(INITIAL_PRODUCTS, '   '), []);
});

test('cart state helpers cap quantities at available stock and block out-of-stock items', () => {
  const outOfStockStole = INITIAL_PRODUCTS.find((p) => p.id === 'prod-silk-stole')!;
  const leatherBag = INITIAL_PRODUCTS.find((p) => p.id === 'prod-leather-bag')!; // stock: 7

  let cart = addToCartState([], outOfStockStole, 1);
  assert.equal(cart.length, 0);

  cart = addToCartState(cart, leatherBag, 5);
  assert.equal(cart[0].quantity, 5);

  // Adding 5 more caps at stock = 7
  cart = addToCartState(cart, leatherBag, 5);
  assert.equal(cart[0].quantity, 7);

  // Updating to 0 removes item
  cart = updateCartQuantityState(cart, leatherBag.id, 0, leatherBag.stock);
  assert.equal(cart.length, 0);

  cart = addToCartState(cart, leatherBag, 2);
  cart = removeFromCartState(cart, leatherBag.id);
  assert.equal(cart.length, 0);
});

test('calculateOrderTotals computes free standard shipping threshold and express shipping', () => {
  const carafe = INITIAL_PRODUCTS.find((p) => p.id === 'prod-carafe')!; // ₹1,499
  const belowThresholdTotals = calculateOrderTotals(
    [{ productId: carafe.id, quantity: 1 }],
    INITIAL_PRODUCTS,
    'standard'
  );
  assert.equal(belowThresholdTotals.subtotal, 1499);
  assert.equal(belowThresholdTotals.shippingCost, 99);
  assert.equal(belowThresholdTotals.total, 1598);
  assert.equal(belowThresholdTotals.freeShippingRemaining, 500);

  const aboveThresholdTotals = calculateOrderTotals(
    [{ productId: carafe.id, quantity: 2 }],
    INITIAL_PRODUCTS,
    'standard'
  );
  assert.equal(aboveThresholdTotals.subtotal, 2998);
  assert.equal(aboveThresholdTotals.shippingCost, 0);
  assert.equal(aboveThresholdTotals.total, 2998);

  const expressTotals = calculateOrderTotals(
    [{ productId: carafe.id, quantity: 2 }],
    INITIAL_PRODUCTS,
    'express'
  );
  assert.equal(expressTotals.shippingCost, 199);
  assert.equal(expressTotals.total, 3197);
});

test('checkout validation functions reject invalid inputs and pass valid ones', () => {
  const customerErrors = validateCustomerInfo({ fullName: '', email: 'bad-email', phone: '123' });
  assert.ok(customerErrors.fullName);
  assert.ok(customerErrors.email);
  assert.ok(customerErrors.phone);

  const validCustomer = validateCustomerInfo({
    fullName: 'Arindam Sen',
    email: 'arindam@example.com',
    phone: '9830012345',
  });
  assert.deepEqual(validCustomer, {});

  const shippingErrors = validateShippingDetails({
    streetAddress: '12',
    locality: '',
    city: '',
    postalCode: '74',
    shippingSpeed: 'standard',
  });
  assert.equal(Object.keys(shippingErrors).length, 4);

  const validShipping = validateShippingDetails({
    streetAddress: '42 Station Road, Satui Bazar',
    locality: 'Satui Chaurigachha',
    city: 'Berhampore, Murshidabad',
    postalCode: '742405',
    shippingSpeed: 'standard',
  });
  assert.deepEqual(validShipping, {});

  assert.deepEqual(
    validatePaymentDetails('cod', {
      upiId: '',
      cardName: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
    }),
    {}
  );

  const upiErrors = validatePaymentDetails('upi', {
    upiId: 'invalidupi',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  });
  assert.ok(upiErrors.upiId);
});
