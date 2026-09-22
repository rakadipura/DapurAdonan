import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const productSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  slug: z.string().min(1, "Slug wajib diisi"),
  description: z.string().default(""),
  basePrice: z.number().int().min(0, "Harga minimal 0"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  dailyStock: z.number().int().nullable().optional(),
  isAvailable: z.boolean().default(true),
  leadTimeDays: z.number().int().min(0).default(0),
  isCustomCake: z.boolean().default(false),
  allergens: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  categoryId: z.number().int().positive(),
  variants: z.array(z.object({
    name: z.string().min(1),
    priceDiff: z.number().int(),
    isDefault: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
  })).default([]),
  addOns: z.array(z.object({
    name: z.string().min(1),
    price: z.number().int().min(0),
    isRequired: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
  })).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
        addOns: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/admin/products failed:", error);
    return NextResponse.json({ error: "Gagal memuat produk" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { variants, addOns, ...productData } = parsed.data;

    const product = await prisma.product.create({
      data: {
        ...productData,
        imageUrl: productData.imageUrl || null,
        variants: { create: variants },
        addOns: { create: addOns },
      },
      include: {
        category: true,
        variants: true,
        addOns: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products failed:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat produk";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}