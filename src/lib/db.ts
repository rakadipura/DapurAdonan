import { PrismaClient } from "@prisma/client";

declare global {
  var __tmmPrisma: PrismaClient | undefined;
}

const prisma = globalThis.__tmmPrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalThis.__tmmPrisma = prisma;
}

export { prisma };
export type { PrismaClient } from "@prisma/client";