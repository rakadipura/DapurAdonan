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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findUnique: (args: any) => getPrisma().bookingSlot.findUnique(args),
    },
    booking: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (args: any) => getPrisma().booking.create(args),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findMany: (args: any) => getPrisma().booking.findMany(args),
    },
    product: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findMany: (args: any) => getPrisma().product.findMany(args),
    },
    order: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: (args: any) => getPrisma().order.create(args),
    },
    orderItem: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      groupBy: (args: any) => getPrisma().orderItem.groupBy(args),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $queryRaw: (query: any, ...args: any[]) => getPrisma().$queryRaw(query, ...args),
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