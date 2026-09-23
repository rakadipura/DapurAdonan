import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated, adminUnauthorized } from "@/lib/admin-auth";

const settingSchema = z.object({
  key: z.string().min(1, "Key wajib diisi"),
  value: z.string(),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    });
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/admin/settings failed:", error);
    return NextResponse.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  try {
    const body = await req.json();
    const parsed = settingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const setting = await prisma.setting.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value },
      create: { key: parsed.data.key, value: parsed.data.value },
    });

    return NextResponse.json({ setting }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/settings failed:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat pengaturan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}