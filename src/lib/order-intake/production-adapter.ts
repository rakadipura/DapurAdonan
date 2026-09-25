import { prisma } from "@/lib/db";
import {
  getPickupWindows,
  getDeliveryZones,
  getOrderCutoffHour,
} from "@/lib/settings";
import {
  normalizePhone,
  isValidPhone,
  isValidEmail,
} from "@/lib/regex";
import type { OrderIntakeAdapter, PickupWindow, DeliveryZone, ContactValidator, TransactionLike, OrderWithItems } from "./types";

export function createProductionAdapter(): OrderIntakeAdapter {
  return {
    prisma: createPrismaAdapter(),
    settings: createSettingsProvider(),
    contact: createContactValidator(),
    idGenerator: generateOrderCode,
    clock: () => new Date(),
    $transaction: async <T>(fn: (tx: TransactionLike) => Promise<T>) => {
      return prisma.$transaction(async (prismaTx: unknown) => {
        const tx = createTxAdapter(prismaTx as {
          $queryRaw: (query: TemplateStringsArray, ...args: unknown[]) => Promise<unknown>;
          orderItem: { groupBy: (args: Record<string, unknown>) => Promise<{ _sum: { qty: number | null } }[]> };
          order: { create: (args: { data: Record<string, unknown>; include: Record<string, unknown> }) => Promise<OrderWithItems> };
        });
        return fn(tx);
      });
    },
  };
}

function createTxAdapter(prismaTx: {
  $queryRaw: (query: TemplateStringsArray, ...args: unknown[]) => Promise<unknown>;
  orderItem: { groupBy: (args: Record<string, unknown>) => Promise<{ _sum: { qty: number | null } }[]> };
  order: { create: (args: { data: Record<string, unknown>; include: Record<string, unknown> }) => Promise<OrderWithItems> };
}): TransactionLike {
  return {
    $queryRaw: async (query: TemplateStringsArray, ...args: unknown[]) => prismaTx.$queryRaw(query, ...args),
    orderItem: {
      groupBy: async (args: Record<string, unknown>) =>
        prismaTx.orderItem.groupBy(args as Parameters<typeof prismaTx.orderItem.groupBy>[0]) as unknown as Promise<{ _sum: { qty: number | null } }[]>,
    },
    order: {
      create: async (args: { data: Record<string, unknown>; include: Record<string, unknown> }) =>
        prismaTx.order.create(args as Parameters<typeof prismaTx.order.create>[0]) as unknown as Promise<OrderWithItems>,
    },
  };
}

function createPrismaAdapter() {
  return {
    product: {
      findUnique: async (args: { where: { id: number }; select: Record<string, unknown> }) =>
        prisma.product.findUnique(args as Parameters<typeof prisma.product.findUnique>[0]) as Promise<unknown>,
      findMany: async (args: { where: { id: { in: number[] } }; select: Record<string, unknown> }) =>
        prisma.product.findMany(args as Parameters<typeof prisma.product.findMany>[0]) as Promise<unknown[]>,
    },
    order: {
      create: async (args: { data: Record<string, unknown>; include: Record<string, unknown> }) =>
        prisma.order.create(args as Parameters<typeof prisma.order.create>[0]) as unknown as Promise<OrderWithItems>,
    },
    orderItem: {
      groupBy: async (args: Record<string, unknown>) =>
        prisma.orderItem.groupBy(args as Parameters<typeof prisma.orderItem.groupBy>[0]) as unknown as Promise<{ _sum: { qty: number | null } }[]>,
    },
    $queryRaw: async (query: TemplateStringsArray, ...args: unknown[]) => prisma.$queryRaw(query, ...args),
  };
}

function createSettingsProvider() {
  return {
    getPickupWindows: () => getPickupWindows(),
    getDeliveryZones: () => getDeliveryZones(),
    getOrderCutoffHour: () => getOrderCutoffHour(),
  };
}

function createContactValidator(): ContactValidator {
  return {
    normalizePhone,
    validatePhone: (raw: string) => {
      const normalized = normalizePhone(raw);
      const valid = isValidPhone(normalized);
      return {
        valid,
        normalized,
        error: valid ? undefined : `Nomor telepon tidak valid: "${raw}". Format: 08xxxxxxxxxx atau +628xxxxxxxxxx`,
      };
    },
    validateEmail: (raw: string) => {
      const valid = isValidEmail(raw);
      return {
        valid,
        error: valid ? undefined : `Alamat email tidak valid: "${raw}". Format: nama@domain.com`,
      };
    },
  };
}

function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type { PickupWindow, DeliveryZone };