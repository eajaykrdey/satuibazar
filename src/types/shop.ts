export type Category = 'All' | 'Electronics' | 'Fashion' | 'Household';

export type SortOption = 'popularity' | 'price-asc' | 'price-desc' | 'newest';

export type ShippingSpeed = 'standard' | 'express';

export type PaymentMethod = 'cod' | 'upi' | 'card';

export interface Product {
  id: string;
  title: string;
  category: Exclude<Category, 'All'>;
  briefDescription: string;
  fullDescription: string;
  specs: string[];
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  stock: number;
  image: string;
  createdAt: string;
  sku: string;
}

export interface FilterState {
  searchQuery: string;
  category: Category;
  maxPrice: number;
  minRating: number;
  inStockOnly: boolean;
  dealsOnly: boolean;
  sortBy: SortOption;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface EnrichedCartItem {
  product: Product;
  quantity: number;
  lineSubtotal: number;
  lineOriginalSubtotal: number;
}

export interface OrderTotals {
  items: EnrichedCartItem[];
  itemCount: number;
  subtotal: number;
  originalSubtotal: number;
  totalSavings: number;
  shippingCost: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
}

export interface ShippingDetails {
  streetAddress: string;
  locality: string;
  city: string;
  postalCode: string;
  shippingSpeed: ShippingSpeed;
}

export interface PaymentDetails {
  upiId: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}

export interface SearchSuggestion {
  type: 'product' | 'category';
  id: string;
  label: string;
  sublabel: string;
  price?: number;
  category?: Exclude<Category, 'All'>;
}

export interface OrderRecord {
  orderId: string;
  createdAt: string;
  customer: CustomerInfo;
  shipping: ShippingDetails;
  paymentMethod: PaymentMethod;
  paymentSummary: string;
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    unitPrice: number;
    lineSubtotal: number;
  }>;
  subtotal: number;
  shippingCost: number;
  totalSavings: number;
  total: number;
  status: 'Confirmed';
}
