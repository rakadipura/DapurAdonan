import { NextRequest, NextResponse } from "next/server";
import { cancelBooking } from "@/lib/bookings";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, phone, reason } = body;

    if (!code || !phone) {
      return NextResponse.json({ error: "Kode dan nomor telepon wajib diisi" }, { status: 400 });
    }

    const booking = await cancelBooking(code, phone, reason);
    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan atau nomor telepon tidak cocok" }, { status: 404 });
    }

    return NextResponse.json({ booking, message: "Booking berhasil dibatalkan" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/bookings/cancel failed:", error);
    const message = error instanceof Error ? error.message : "Gagal membatalkan booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}