import { NextRequest, NextResponse } from "next/server";
import { createBooking, getBooking } from "@/lib/bookings";
import { createBookingSchema } from "@/validations/bookings";
import { revalidatePath } from "next/cache";
import { normalizePhone } from "@/lib/regex";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Normalize phone before validation
    if (body.phone) {
      body.phone = normalizePhone(body.phone);
    }

    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Validate email format if provided
    const email = parsed.data.email;
    if (email && email !== "" && !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Data tidak valid", details: { email: ["Format email tidak valid"] } },
        { status: 400 },
      );
    }

    const booking = await createBooking({
      ...parsed.data,
      email: email && email !== "" ? email : undefined,
    });
    revalidatePath("/booking");
    return NextResponse.json(
      {
        booking,
        redirectUrl: `/booking/success?code=${booking.code}&phone=${encodeURIComponent(booking.phone)}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/bookings failed:", error);
    const message =
      error instanceof Error ? error.message : "Gagal membuat booking";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!code || !phone) {
    return NextResponse.json(
      { error: "Kode dan nomor telepon wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const booking = await getBooking(code, phone);
    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ booking }, { status: 200 });
  } catch (error) {
    console.error("GET /api/bookings failed:", error);
    return NextResponse.json({ error: "Gagal memuat booking" }, { status: 500 });
  }
}
