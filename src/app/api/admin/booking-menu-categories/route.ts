import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated, adminUnauthorized } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, sortOrder: true },
    });

    const raw = await prisma.setting.findUnique({ where: { key: "bookingMenuCategories" } });
    let config: Array<{ categoryId: number; categoryName: string; isVisible: boolean; sortOrder: number }> = [];
    if (raw?.value) {
      try {
        config = JSON.parse(raw.value);
      } catch {
        config = [];
      }
    }

    // Merge with current categories
    const merged = categories.map((cat) => {
      const existing = config.find((c) => c.categoryId === cat.id);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        isVisible: existing?.isVisible ?? true,
        sortOrder: existing?.sortOrder ?? cat.sortOrder,
      };
    });

    return NextResponse.json({ categories: merged });
  } catch (error) {
    console.error("GET /api/admin/booking-menu-categories failed:", error);
    return NextResponse.json({ error: "Gagal memuat konfigurasi menu" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const body = await req.json();
    const { categories } = body;

    if (!Array.isArray(categories)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    // Validate each category
    for (const cat of categories) {
      if (
        typeof cat.categoryId !== "number" ||
        typeof cat.categoryName !== "string" ||
        typeof cat.isVisible !== "boolean" ||
        typeof cat.sortOrder !== "number"
      ) {
        return NextResponse.json({ error: "Format kategori tidak valid" }, { status: 400 });
      }
    }

    await prisma.setting.upsert({
      where: { key: "bookingMenuCategories" },
      update: { value: JSON.stringify(categories) },
      create: { key: "bookingMenuCategories", value: JSON.stringify(categories) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/booking-menu-categories failed:", error);
    return NextResponse.json({ error: "Gagal menyimpan konfigurasi menu" }, { status: 500 });
  }
}