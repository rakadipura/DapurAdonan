import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const categorySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")).optional(),
  sortOrder: z.number().int().optional(),
  isVisible: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { products: true } },
      },
    });
    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (error) {
    console.error("GET /api/admin/categories/[id] failed:", error);
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        ...parsed.data,
        imageUrl: parsed.data.imageUrl === "" ? null : parsed.data.imageUrl,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("PUT /api/admin/categories/[id] failed:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui kategori";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.category.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}