import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const settingSchema = z.object({
  value: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: id },
    });
    if (!setting) {
      return NextResponse.json({ error: "Pengaturan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ setting });
  } catch (error) {
    console.error("GET /api/admin/settings/[id] failed:", error);
    return NextResponse.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = settingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const setting = await prisma.setting.update({
      where: { key: id },
      data: { value: parsed.data.value },
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("PUT /api/admin/settings/[id] failed:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui pengaturan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.setting.delete({ where: { key: id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/settings/[id] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus pengaturan" }, { status: 500 });
  }
}