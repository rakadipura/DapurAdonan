import { PrismaClient, Prisma } from "@prisma/client";
import { BookingIntakeAdapter } from "./types";
import { getBookingLeadHours } from "@/lib/settings";
import { normalizePhone, isValidPhone, isValidEmail } from "@/lib/regex";

let prismaInstance: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

function getIdGenerator(): () => string {
  return () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };
}

export const productionAdapter: BookingIntakeAdapter = {
  prisma: {
    bookingSlot: {
      findUnique: (args: { where: { id: number } }) => getPrisma().bookingSlot.findUnique(args as any),
    },
    booking: {
      create: (args: { data: Record<string, unknown>; include?: Record<string, unknown> }) => getPrisma().booking.create(args as any),
      update: (args: { where: { code: string }; data: Record<string, unknown>; include?: Record<string, unknown> }) => getPrisma().booking.update(args as any),
      findMany: (args: { where: Record<string, unknown>; select: Record<string, unknown> }) => getPrisma().booking.findMany(args as any),
      findUnique: (args: { where: { code: string }; include?: Record<string, unknown> }) => getPrisma().booking.findUnique(args as any),
    },
    product: {
      findMany: (args: { where: { id: { in: number[] } }; select: Record<string, unknown> }) => getPrisma().product.findMany(args as any),
    },
    order: {
      create: (args: { data: Record<string, unknown>; include?: Record<string, unknown> }) => getPrisma().order.create(args as any),
    },
    orderItem: {
      groupBy: (args: Record<string, unknown>) => getPrisma().orderItem.groupBy(args as any),
    },
    $queryRaw: (query: TemplateStringsArray, ...args: unknown[]) => getPrisma().$queryRaw(query, ...args),
    $queryRawUnsafe: (query: string, ...args: unknown[]) => getPrisma().$queryRawUnsafe(query, ...args),
  },
  settings: {
    getBookingLeadHours: () => getBookingLeadHours(),
  },
  contact: {
    normalizePhone: (raw) => normalizePhone(raw),
    validatePhone: (raw) => {
      const normalized = normalizePhone(raw);
      return { valid: isValidPhone(normalized), normalized };
    },
    validateEmail: (raw) => ({ valid: isValidEmail(raw) }),
  },
  idGenerator: getIdGenerator(),
  clock: () => new Date(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: <T>(fn: (tx: any) => Promise<T>) => getPrisma().$transaction(fn),
};