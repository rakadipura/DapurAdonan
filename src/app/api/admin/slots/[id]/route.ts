import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const slotSchema = z.object({
  name: z.string().min(1).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  capacity: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const slot = await prisma.bookingSlot.findUnique({
      where: { id: parseInt(id) },
    });
    if (!slot) {
      return NextResponse.json({ error: "Jadwal tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ slot });
  } catch (error) {
    console.error("GET /api/admin/slots/[id] failed:", error);
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const parsed = slotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const slot = await prisma.bookingSlot.update({
      where: { id: parseInt(id) },
      data: parsed.data,
    });

    return NextResponse.json({ slot });
  } catch (error) {
    console.error("PUT /api/admin/slots/[id] failed:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui jadwal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.bookingSlot.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/slots/[id] failed:", error);
    return NextResponse.json({ error: "Gagal menghapus jadwal" }, { status: 500 });
  }
}