import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Test Products",
};

export default async function TestPage() {
  try {
    const products = await prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        dailyStock: true,
        isAvailable: true,
        leadTimeDays: true,
        isCustomCake: true,
        allergens: true,
        tags: true,
        category: { select: { name: true, slug: true } },
        variants: { select: { id: true, name: true, priceDiff: true, isDefault: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
        addOns: { select: { id: true, name: true, price: true, isRequired: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Test Products Works!</h1>
        <p>Products count: {products.length}</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8 text-red-600">
        <h1 className="text-2xl font-bold">Products Error</h1>
        <pre>{error instanceof Error ? error.message : String(error)}</pre>
      </div>
    );
  }
}