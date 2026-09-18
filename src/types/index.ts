export interface CustomerType {
  name: string;
  phone: string;
  email: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  qty: number;
  notes?: string;
  categoryName?: string;
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
  | "NO_SHOW";

export type OrderType = "PICKUP" | "DELIVERY";

export type PaymentMethod = "TRANSFER" | "EWALLET" | "CASH";

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string | null;
  dailyStock: number | null;
  isAvailable: boolean;
  category: { name: string; slug: string };
}

export interface CategorySummary {
  id: number;
  name: string;
  slug: string;
}
