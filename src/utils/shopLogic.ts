import type {
  CartItem,
  Category,
  CustomerInfo,
  FilterState,
  OrderTotals,
  PaymentDetails,
  PaymentMethod,
  Product,
  SearchSuggestion,
  ShippingDetails,
  ShippingSpeed,
} from '../types/shop';

export const FREE_SHIPPING_THRESHOLD = 1999;
export const STANDARD_SHIPPING_COST = 99;
export const EXPRESS_SHIPPING_COST = 199;
export const MAX_CATALOG_PRICE = 9000;
export const DEAL_DISCOUNT_THRESHOLD = 25;

export const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  category: 'All',
  maxPrice: MAX_CATALOG_PRICE,
  minRating: 0,
  inStockOnly: false,
  dealsOnly: false,
  sortBy: 'popularity',
};

export function formatPrice(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function calculateDiscountPercent(price: number, originalPrice: number): number {
  if (originalPrice <= 0 || price >= originalPrice) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function filterAndSortProducts(products: Product[], filters: FilterState): Product[] {
  const normalizedQuery = filters.searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (filters.category !== 'All' && product.category !== filters.category) {
      return false;
    }

    if (product.price > filters.maxPrice) {
      return false;
    }

    if (filters.minRating > 0 && product.rating < filters.minRating) {
      return false;
    }

    if (filters.inStockOnly && product.stock <= 0) {
      return false;
    }

    if (filters.dealsOnly) {
      const discount = calculateDiscountPercent(product.price, product.originalPrice);
      if (discount < DEAL_DISCOUNT_THRESHOLD) {
        return false;
      }
    }

    if (normalizedQuery.length > 0) {
      const searchableText = [
        product.title,
        product.category,
        product.briefDescription,
        product.sku,
      ]
        .join(' ')
        .toLowerCase();

      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      const matchesAllTokens = tokens.every((token) => searchableText.includes(token));
      if (!matchesAllTokens) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'popularity':
    default:
      sorted.sort((a, b) => {
        const aAvailable = a.stock > 0 ? 1 : 0;
        const bAvailable = b.stock > 0 ? 1 : 0;
        if (aAvailable !== bAvailable) {
          return bAvailable - aAvailable;
        }
        const scoreA = a.reviewCount * a.rating;
        const scoreB = b.reviewCount * b.rating;
        return scoreB - scoreA;
      });
      break;
  }

  return sorted;
}

export function getSearchSuggestions(
  products: Product[],
  query: string,
  limit = 6
): SearchSuggestion[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const categories: Array<Exclude<Category, 'All'>> = ['Electronics', 'Fashion', 'Household'];
  const suggestions: SearchSuggestion[] = [];

  for (const cat of categories) {
    if (cat.toLowerCase().includes(trimmed)) {
      const count = products.filter((p) => p.category === cat).length;
      suggestions.push({
        type: 'category',
        id: `cat-${cat.toLowerCase()}`,
        label: cat,
        sublabel: `${count} curated items in ${cat}`,
        category: cat,
      });
    }
  }

  const matchingProducts = products
    .filter((product) => {
      const haystack = `${product.title} ${product.category} ${product.briefDescription}`.toLowerCase();
      return haystack.includes(trimmed);
    })
    .slice(0, Math.max(1, limit - suggestions.length));

  for (const product of matchingProducts) {
    suggestions.push({
      type: 'product',
      id: product.id,
      label: product.title,
      sublabel: `${product.category} · Rated ${product.rating.toFixed(1)}`,
      price: product.price,
      category: product.category,
    });
  }

  return suggestions.slice(0, limit);
}

export function addToCartState(
  cart: CartItem[],
  product: Product,
  quantityToAdd = 1
): CartItem[] {
  if (product.stock <= 0 || quantityToAdd <= 0) {
    return cart;
  }

  const existingIndex = cart.findIndex((item) => item.productId === product.id);
  if (existingIndex === -1) {
    return [
      ...cart,
      {
        productId: product.id,
        quantity: Math.min(quantityToAdd, product.stock),
      },
    ];
  }

  return cart.map((item, idx) => {
    if (idx !== existingIndex) return item;
    return {
      ...item,
      quantity: Math.min(item.quantity + quantityToAdd, product.stock),
    };
  });
}

export function updateCartQuantityState(
  cart: CartItem[],
  productId: string,
  nextQuantity: number,
  maxStock: number
): CartItem[] {
  if (nextQuantity <= 0 || maxStock <= 0) {
    return cart.filter((item) => item.productId !== productId);
  }

  const capped = Math.min(nextQuantity, maxStock);
  return cart.map((item) =>
    item.productId === productId ? { ...item, quantity: capped } : item
  );
}

export function removeFromCartState(cart: CartItem[], productId: string): CartItem[] {
  return cart.filter((item) => item.productId !== productId);
}

export function calculateOrderTotals(
  cart: CartItem[],
  products: Product[],
  shippingSpeed: ShippingSpeed = 'standard'
): OrderTotals {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const items = cart
    .map((entry) => {
      const product = productMap.get(entry.productId);
      if (!product || entry.quantity <= 0) return null;
      const safeQuantity = Math.min(entry.quantity, Math.max(product.stock, entry.quantity));
      return {
        product,
        quantity: safeQuantity,
        lineSubtotal: product.price * safeQuantity,
        lineOriginalSubtotal: product.originalPrice * safeQuantity,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.lineSubtotal, 0);
  const originalSubtotal = items.reduce((sum, item) => sum + item.lineOriginalSubtotal, 0);
  const totalSavings = Math.max(0, originalSubtotal - subtotal);

  let shippingCost = 0;
  if (subtotal > 0) {
    if (shippingSpeed === 'express') {
      shippingCost = EXPRESS_SHIPPING_COST;
    } else {
      shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
    }
  }

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const total = subtotal + shippingCost;

  return {
    items,
    itemCount,
    subtotal,
    originalSubtotal,
    totalSavings,
    shippingCost,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    freeShippingRemaining,
  };
}

export function validateCustomerInfo(info: CustomerInfo): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!info.fullName || info.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  }

  const emailTrimmed = info.email.trim();
  if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    errors.email = 'Please enter a valid email address for order confirmation.';
  }

  const digitsOnly = info.phone.replace(/[\s\-+()]/g, '');
  if (!digitsOnly || !/^\d{10,13}$/.test(digitsOnly)) {
    errors.phone = 'Please enter a valid 10-digit mobile number.';
  }

  return errors;
}

export function validateShippingDetails(shipping: ShippingDetails): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!shipping.streetAddress || shipping.streetAddress.trim().length < 5) {
    errors.streetAddress = 'Please enter your house number and street address.';
  }

  if (!shipping.locality || shipping.locality.trim().length < 2) {
    errors.locality = 'Please enter your town, locality, or landmark.';
  }

  if (!shipping.city || shipping.city.trim().length < 2) {
    errors.city = 'Please enter your city or district.';
  }

  const pin = shipping.postalCode.trim();
  if (!pin || !/^\d{5,6}$/.test(pin)) {
    errors.postalCode = 'Please enter a valid 5 or 6-digit PIN / postal code.';
  }

  return errors;
}

export function validatePaymentDetails(
  method: PaymentMethod,
  details: PaymentDetails
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (method === 'cod') {
    return errors;
  }

  if (method === 'upi') {
    const upi = details.upiId.trim();
    if (!upi || !/^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upi)) {
      errors.upiId = 'Enter a valid UPI ID (for example: customer@okaxis).';
    }
    return errors;
  }

  if (method === 'card') {
    if (!details.cardName || details.cardName.trim().length < 2) {
      errors.cardName = 'Enter the cardholder name as shown on your card.';
    }

    const cardDigits = details.cardNumber.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(cardDigits)) {
      errors.cardNumber = 'Enter a valid 16-digit card number.';
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(details.cardExpiry.trim())) {
      errors.cardExpiry = 'Enter expiry date in MM/YY format.';
    }

    if (!/^\d{3,4}$/.test(details.cardCvv.trim())) {
      errors.cardCvv = 'Enter a valid 3 or 4-digit CVV security code.';
    }
  }

  return errors;
}
