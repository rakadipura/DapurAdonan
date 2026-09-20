import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const productSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  basePrice: z.number().int().min(0).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).optional(),
  dailyStock: z.number().int().nullable().optional(),
  isAvailable: z.boolean().optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  isCustomCake: z.boolean().optional(),
  allergens: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  categoryId: z.number().int().positive().optional(),
  variants: z.array(z.object({
    id: z.number().int().optional(),
    name: z.string().min(1),
    priceDiff: z.number().int(),
    isDefault: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
  })).optional(),
  addOns: z.array(z.object({
    id: z.number().int().optional(),
    name: z.string().min(1),
    price: z.number().int().min(0),
    isRequired: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
  })).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
        addOns: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("GET /api/admin/products/[id] failed:", error);
    return NextResponse.json({ error: "Gagal memuat produk" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Update product
    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        ...productData,
        imageUrl: productData.imageUrl === "" ? null : productData.imageUrl,
      },
    });

    // Update variants (delete and recreate for simplicity)
    if (variants) {
      await prisma.productVariant.deleteMany({ where: { productId: parseInt(id) } });
      if (variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants.map((v) => ({
            productId: parseInt(id),
            name: v.name,
            priceDiff: v.priceDiff,
            isDefault: v.isDefault,
            sortOrder: v.sortOrder,
          })),
        });
      }
    }

    // Update add-ons
    if (addOns) {
      await prisma.addOn.deleteMany({ where: { productId: parseInt(id) } });
      if (addOns.length > 0) {
        await prisma.addOn.createMany({
          data: addOns.map((a) => ({
            productId: parseInt(id),
            name: a.name,
            price: a.price,
            isRequired: a.isRequired,
            sortOrder: a.sortOrder,
          })),
        });
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
        addOns: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("PUT /api/admin/products/[id] failed:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui produk";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/products/[id] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}