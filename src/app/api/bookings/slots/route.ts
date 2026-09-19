import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/bookings";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(date);
    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("GET /api/bookings/slots failed:", error);
    return NextResponse.json({ error: "Gagal memuat jadwal" }, { status: 500 });
  }
}