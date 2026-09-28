import { NextRequest, NextResponse } from "next/server";
import { BookingIntake, productionAdapter } from "@/lib/booking-intake";
import { BookingIntakeError } from "@/lib/booking-intake/types";

const bookingIntake = new BookingIntake(productionAdapter);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, phone, newDate, newSlotId, newPartySize } = body;

    if (!code || !phone || !newDate || !newSlotId || !newPartySize) {
      return NextResponse.json({ error: "Kode, nomor telepon, tanggal baru, slot baru, dan jumlah orang baru wajib diisi" }, { status: 400 });
    }

    const result = await bookingIntake.reschedule({ code, phone, newDate, newSlotId, newPartySize });
    return NextResponse.json({ booking: result.booking, message: "Booking berhasil dijadwal ulang" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/bookings/reschedule failed:", error);
    if (error instanceof BookingIntakeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Gagal menjadwal ulang booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}