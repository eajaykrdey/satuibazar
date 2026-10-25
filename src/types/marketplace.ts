export type UserRole = 'customer' | 'vendor' | 'admin';

export type VendorApprovalStatus = 'approved' | 'pending' | 'suspended';

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  isFastDeliveryEligible: boolean;
  isSystemDefault: boolean;
}

export interface VendorShop {
  id: string;
  name: string;
  ownerUserId: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
  primaryCategory: string;
  description: string;
  rating: number;
  joinedAt: string;
  approvalStatus: VendorApprovalStatus;
  commissionRatePct: number;
  bankDetails: {
    accountHolder: string;
    accountNumberMasked: string;
    ifscCode: string;
    upiPayoutId: string;
  };
}

export interface MarketplaceProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  category: string;
  shopId: string;
  shopName: string;
  mrp: number;
  price: number;
  unitLabel: string;
  rating: number;
  reviewCount: number;
  stock: number;
  imageUrl: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface MarketplaceUser {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  pincode: string;
  shopId?: string;
  createdAt: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface ShopCartGroup {
  shopId: string;
  shopName: string;
  shopLocation: string;
  items: Array<{
    product: MarketplaceProduct;
    quantity: number;
    lineMrpTotal: number;
    lineSubtotal: number;
  }>;
  itemCount: number;
  shopMrpSubtotal: number;
  shopSubtotal: number;
}

export interface GroupedCartSummary {
  groups: ShopCartGroup[];
  totalItemCount: number;
  distinctShopCount: number;
  mrpTotal: number;
  subtotal: number;
  totalSavings: number;
  deliveryFee: number;
  grandTotal: number;
  hasPerishableOrFastFood: boolean;
}

export type CustomerOrderOverallStatus =
  | 'Pending'
  | 'Processing'
  | 'Out for Delivery'
  | 'Completed';

export type VendorFulfillmentStatus =
  | 'Pending'
  | 'Accepted'
  | 'Preparing'
  | 'Ready for Dispatch'
  | 'Out for Delivery'
  | 'Completed';

export interface OrderShopItem {
  productId: string;
  sku: string;
  title: string;
  unitLabel: string;
  quantity: number;
  mrp: number;
  unitPrice: number;
  lineSubtotal: number;
}

export interface OrderVendorBreakdown {
  shopId: string;
  shopName: string;
  vendorStatus: VendorFulfillmentStatus;
  items: OrderShopItem[];
  shopSubtotal: number;
  platformCommission: number;
  vendorNetEarnings: number;
  updatedAt: string;
}

export type PaymentMethodType = 'cod' | 'upi' | 'card';

export interface MarketplaceOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: {
    street: string;
    locality: string;
    city: string;
    pincode: string;
  };
  deliverySchedule: {
    slotId: string;
    slotLabel: string;
    instructions: string;
  };
  paymentMethod: PaymentMethodType;
  paymentSummary: string;
  overallStatus: CustomerOrderOverallStatus;
  vendorBreakdowns: OrderVendorBreakdown[];
  subtotal: number;
  deliveryFee: number;
  totalSavings: number;
  grandTotal: number;
  createdAt: string;
}

/**
 * Strictly isolated order view exposed to a single Shop Owner.
 * Contains ONLY that shop's items, fulfillment status, and net earnings.
 */
export interface VendorScopedOrder {
  orderId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryLocality: string;
  deliveryPincode: string;
  deliverySlotLabel: string;
  paymentMethod: PaymentMethodType;
  vendorStatus: VendorFulfillmentStatus;
  items: OrderShopItem[];
  shopSubtotal: number;
  platformCommission: number;
  vendorNetEarnings: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole | 'guest';
  action: string;
  targetSummary: string;
}

export interface PincodeZone {
  pincode: string;
  areaName: string;
  etaLabel: string;
}

export type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'rating-desc' | 'discount-desc';

export interface StorefrontFilterState {
  searchQuery: string;
  category: string; // 'All' or category name
  shopId: string;   // 'ALL' or shopId
  inStockOnly: boolean;
  maxPrice: number;
  sortBy: SortMode;
}
