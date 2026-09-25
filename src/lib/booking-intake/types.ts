import type { BookingWithSlot } from "@/lib/bookings";
import type { OrderWithItems } from "@/lib/orders";

export type { BookingWithSlot, OrderWithItems };

export interface CreateBookingWithMenuInput {
  date: string;
  slotId: number;
  partySize: number;
  name: string;
  phone: string;
  email?: string;
  menuItems?: Array<{
    productId: number;
    variantId?: number;
    qty: number;
    notes?: string;
    selectedAddOns?: string[];
  }>;
}

export interface BookingWithMenuResult {
  booking: BookingWithSlot;
  orders: OrderWithItems[];
}

export interface BookingIntakeAdapter {
  prisma: PrismaLike;
  settings: SettingsProvider;
  contact: ContactValidator;
  idGenerator: () => string;
  clock: () => Date;
  $transaction: <T>(fn: (tx: TransactionLike) => Promise<T>) => Promise<T>;
}

export interface PrismaLike {
  bookingSlot: {
    findUnique: (args: { where: { id: number } }) => Promise<{
      id: number;
      name: string;
      startTime: string;
      endTime: string;
      capacity: number;
      isActive: boolean;
    } | null>;
  };
  booking: {
    create: (args: { data: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<any>;
    findMany: (args: { where: Record<string, unknown>; select: Record<string, unknown> }) => Promise<Array<{ partySize: number }>>;
  };
  product: {
    findMany: (args: { where: { id: { in: number[] } }; select: Record<string, unknown> }) => Promise<unknown[]>;
  };
  order: {
    create: (args: { data: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<any>;
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

export interface TransactionLike {
  $queryRaw: (query: TemplateStringsArray, ...args: unknown[]) => Promise<unknown>;
  orderItem: {
    groupBy: (args: Record<string, unknown>) => Promise<{ _sum: { qty: number | null } }[]>;
  };
  booking: {
    create: (args: { data: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<any>;
  };
  order: {
    create: (args: { data: Record<string, unknown>; include?: Record<string, unknown> }) => Promise<any>;
  };
}

export interface SettingsProvider {
  getBookingLeadHours(): Promise<number>;
}

export interface ContactValidator {
  normalizePhone(raw: string): string;
  validatePhone(raw: string): { valid: boolean; normalized: string; error?: string };
  validateEmail(raw: string): { valid: boolean; error?: string };
}

export type BookingIntakeErrorCode =
  | "INVALID_SLOT"
  | "SLOT_INACTIVE"
  | "INVALID_DATE"
  | "DATE_IN_PAST"
  | "INVALID_PARTY_SIZE"
  | "PARTY_EXCEEDS_CAPACITY"
  | "SLOT_FULL"
  | "INVALID_PHONE"
  | "INVALID_EMAIL"
  | "INVALID_MENU_ITEM"
  | "PRODUCT_UNAVAILABLE"
  | "INVALID_VARIANT"
  | "MISSING_REQUIRED_ADDON"
  | "INSUFFICIENT_STOCK"
  | "LEAD_TIME_VIOLATION";

export class BookingIntakeError extends Error {
  constructor(
    public readonly code: BookingIntakeErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BookingIntakeError";
  }
}