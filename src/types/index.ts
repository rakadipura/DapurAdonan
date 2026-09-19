export interface CustomerType {
  name: string;
  phone: string;
  email: string;
}

export interface CartItem {
  productId: number;
  variantId?: number;
  name: string;
  price: number;
  imageUrl: string | null;
  qty: number;
  notes?: string;
  categoryName?: string;
  selectedAddOns?: string[]; // add-on IDs
  addOnsPrice?: number;
}

export interface PickupWindow {
  start: string;
  end: string;
}

export interface DeliveryZone {
  zone: string;
  baseFee: number;
  perKm: number;
  maxKm: number;
  freeMin: number;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "BAKING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW"
  | "RESCHEDULED";

export type OrderType = "PICKUP" | "DELIVERY";

export type PaymentMethod = "TRANSFER" | "EWALLET" | "CASH" | "QRIS";

export interface ProductVariant {
  id: number;
  name: string;
  priceDiff: number;
  isDefault: boolean;
  sortOrder: number;
}

export interface AddOn {
  id: number;
  name: string;
  price: number;
  isRequired: boolean;
  sortOrder: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  price: number; // computed: basePrice + variant priceDiff
  imageUrl: string | null;
  dailyStock: number | null;
  isAvailable: boolean;
  leadTimeDays: number;
  isCustomCake: boolean;
  allergens: string[];
  tags: string[];
  category?: {
    name: string;
    slug: string;
    imageUrl?: string | null;
    sortOrder?: number;
    isVisible?: boolean;
  };
  variants?: ProductVariant[];
  addOns?: AddOn[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string | null;
  sortOrder?: number;
  isVisible?: boolean;
}

export interface BookingSlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
  order: number;
}

export interface Booking {
  id: number;
  code: string;
  date: string;
  slotId: number;
  slot?: BookingSlot;
  partySize: number;
  name: string;
  phone: string;
  email?: string;
  status: BookingStatus;
  cancelledAt?: string;
  cancelReason?: string;
  rescheduledFromId?: number;
  rescheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  code: string;
  status: OrderStatus;
  type: OrderType;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  pickupDate?: string;
  pickupWindow?: string;
  deliveryAddress?: string;
  deliveryZone?: string;
  deliveryFee: number;
  notes?: string;
  isCustomCake: boolean;
  customText?: string;
  customDesign?: string;
  customPhotoUrl?: string;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  paymentProofUrl?: string;
  total: number;
  itemsOrder: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product: Product;
  variantId?: number;
  variant?: ProductVariant;
  qty: number;
  notes?: string;
  selectedAddOns?: string[];
  addOnsPrice: number;
  price: number;
}

export interface SessionState {
  cart: CartItem[];
  contact: CustomerType | null;
  totalAmount: number;
  itemCount: number;
}

export interface SlotAvailability {
  slotId: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  available: number;
  isAvailable: boolean;
}