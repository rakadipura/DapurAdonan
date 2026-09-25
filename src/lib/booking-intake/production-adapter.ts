import { PrismaClient } from "@prisma/client";
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
      findUnique: (args) => getPrisma().bookingSlot.findUnique(args),
    },
    booking: {
      create: (args) => getPrisma().booking.create(args as any),
      findMany: (args) => getPrisma().booking.findMany(args as any),
    },
    product: {
      findMany: (args) => getPrisma().product.findMany(args as any),
    },
    order: {
      create: (args) => getPrisma().order.create(args as any),
    },
    orderItem: {
      groupBy: (args) => getPrisma().orderItem.groupBy(args as any),
    },
    $queryRaw: (query, ...args) => getPrisma().$queryRaw(query, ...args),
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
  $transaction: <T>(fn: (tx: any) => Promise<T>) => getPrisma().$transaction(fn),
};