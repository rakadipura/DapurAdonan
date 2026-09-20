import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const slotSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  capacity: z.number().int().min(1).default(4),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
});

export async function GET() {
  try {
    const slots = await prisma.bookingSlot.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("GET /api/admin/slots failed:", error);
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = slotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const slot = await prisma.bookingSlot.create({
      data: parsed.data,
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/slots failed:", error);
    const message = error instanceof Error ? error.message : "Gagal membuat jadwal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}