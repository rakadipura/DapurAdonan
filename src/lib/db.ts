// Thin type-only helpers so other modules can import Prisma types without importing
// the runtime client at build time.
export type { PrismaClient, Prisma } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __tmmPrisma: ReturnType<typeof getPrismaClient> | undefined;
}

function getPrismaClient() {
  const { PrismaClient } = require("@prisma/client");
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalThis.__tmmPrisma ?? (globalThis.__tmmPrisma = getPrismaClient());
