import { NextRequest, NextResponse } from "next/server";
import { rescheduleBooking } from "@/lib/bookings";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, phone, newDate, newSlotId } = body;

    if (!code || !phone || !newDate || !newSlotId) {
      return NextResponse.json({ error: "Kode, nomor telepon, tanggal baru, dan slot baru wajib diisi" }, { status: 400 });
    }

    const booking = await rescheduleBooking(code, phone, newDate, newSlotId);
    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan atau nomor telepon tidak cocok" }, { status: 404 });
    }

    return NextResponse.json({ booking, message: "Booking berhasil dijadwal ulang" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/bookings/reschedule failed:", error);
    const message = error instanceof Error ? error.message : "Gagal menjadwal ulang booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}