import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const categorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  slug: z.string().min(1, "Slug wajib diisi"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
  isVisible: z.boolean().default(true),
});

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("GET /api/admin/categories failed:", error);
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const category = await prisma.category.create({
      data: {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl || null,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/categories failed:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat kategori";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}