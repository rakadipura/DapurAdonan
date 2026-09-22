import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/bookings";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Parameter 'date' (format YYYY-MM-DD) wajib diisi" }, { status: 400 });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: `Format tanggal tidak valid: "${date}". Gunakan format YYYY-MM-DD (contoh: 2026-09-25)` }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(date);
    return NextResponse.json({ slots }, { status: 200 });
  } catch (error) {
    console.error("GET /api/bookings/slots failed:", error);
    const message = error instanceof Error ? error.message : "Gagal memuat jadwal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}