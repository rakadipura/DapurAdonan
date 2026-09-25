import type { OrderWithItems } from "@/lib/orders";
import type { CreateOrderInput } from "@/lib/orders";

export type { CreateOrderInput, OrderWithItems };

export interface OrderIntakeAdapter {
  prisma: PrismaLike;
  settings: SettingsProvider;
  contact: ContactValidator;
  idGenerator: () => string;
  clock: () => Date;
  $transaction: <T>(fn: (tx: TransactionLike) => Promise<T>) => Promise<T>;
}

export interface PrismaLike {
  product: {
    findUnique: (args: { where: { id: number }; select: Record<string, unknown> }) => Promise<unknown>;
    findMany: (args: { where: { id: { in: number[] } }; select: Record<string, unknown> }) => Promise<unknown[]>;
  };
  order: {
    create: (args: { data: Record<string, unknown>; include: Record<string, unknown> }) => Promise<OrderWithItems>;
  };
  orderItem: {
    groupBy: (args: Record<string, unknown>) => Promise<{ _sum: { qty: number | null } }[]>;
  };
  $queryRaw: (query: TemplateStringsArray, ...args: unknown[]) => Promise<unknown>;
}

export interface ProductData {
  id: number;
  name: string;
  imageUrl: string | null;
  basePrice: number;
  dailyStock: number | null;
  isAvailable: boolean;
  leadTimeDays: number;
  variants: Array<{ id: number; name: string; priceDiff: number }>;
  addOns: Array<{ id: number; name: string; price: number; isRequired: boolean }>;
}

export interface StockCheckWhere {
  productId: number;
  order: {
    status: { in: string[] };
    createdAt: { gte: Date; lt: Date };
  };
}

export interface TransactionLike {
  $queryRaw: (query: TemplateStringsArray, ...args: unknown[]) => Promise<unknown>;
  orderItem: {
    groupBy: (args: Record<string, unknown>) => Promise<{ _sum: { qty: number | null } }[]>;
  };
  order: {
    create: (args: { data: Record<string, unknown>; include: Record<string, unknown> }) => Promise<OrderWithItems>;
  };
}

export interface OrderCreateData {
  code: string;
  status: "PENDING";
  type: "PICKUP" | "DELIVERY";
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  pickupDate: Date | null;
  pickupWindow: string | null;
  deliveryAddress: string | null;
  deliveryZone: string | null;
  deliveryFee: number;
  notes: string | null;
  isCustomCake: boolean;
  customText: string | null;
  customDesign: string | null;
  customPhotoUrl: string | null;
  paymentMethod: string;
  isPaid: boolean;
  paymentProofUrl: string | null;
  total: number;
  createdAt: Date;
  bookingId: number | null;
  itemsOrder: {
    create: OrderItemCreateData[];
  };
}

export interface OrderItemCreateData {
  productId: number;
  variantId: number | null;
  qty: number;
  notes: string | null;
  selectedAddOns: string[];
  addOnsPrice: number;
  price: number;
}

export interface SettingsProvider {
  getPickupWindows(): Promise<PickupWindow[]>;
  getDeliveryZones(): Promise<DeliveryZone[]>;
  getOrderCutoffHour(): Promise<number>;
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

export interface ContactValidator {
  normalizePhone(raw: string): string;
  validatePhone(raw: string): { valid: boolean; normalized: string; error?: string };
  validateEmail(raw: string): { valid: boolean; error?: string };
}

export type OrderIntakeErrorCode =
  | "INVALID_ITEM"
  | "PRODUCT_UNAVAILABLE"
  | "INVALID_VARIANT"
  | "MISSING_REQUIRED_ADDON"
  | "INSUFFICIENT_STOCK"
  | "LEAD_TIME_VIOLATION"
  | "INVALID_PICKUP_DATE"
  | "INVALID_PICKUP_WINDOW"
  | "INVALID_DELIVERY_ZONE"
  | "INVALID_PHONE"
  | "INVALID_EMAIL";

export class OrderIntakeError extends Error {
  constructor(
    public readonly code: OrderIntakeErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "OrderIntakeError";
  }
}