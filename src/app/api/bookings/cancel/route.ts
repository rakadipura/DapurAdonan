import { NextRequest, NextResponse } from "next/server";
import { BookingIntake, productionAdapter } from "@/lib/booking-intake";
import { BookingIntakeError } from "@/lib/booking-intake/types";

const bookingIntake = new BookingIntake(productionAdapter);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, phone, reason } = body;

    if (!code || !phone) {
      return NextResponse.json({ error: "Kode dan nomor telepon wajib diisi" }, { status: 400 });
    }

    const result = await bookingIntake.cancel({ code, phone, reason });
    return NextResponse.json({ booking: result, message: "Booking berhasil dibatalkan" }, { status: 200 });
  } catch (error) {
    console.error("POST /api/bookings/cancel failed:", error);
    if (error instanceof BookingIntakeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Gagal membatalkan booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}