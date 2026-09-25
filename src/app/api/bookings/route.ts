import { NextRequest, NextResponse } from "next/server";
import { BookingIntake, productionAdapter } from "@/lib/booking-intake";
import { createBookingSchema } from "@/validations/bookings";
import { revalidatePath } from "next/cache";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatZodError(fieldErrors: Record<string, string[]>): string {
  const messages: string[] = [];

  for (const [field, errors] of Object.entries(fieldErrors)) {
    for (const error of errors) {
      const fieldName = getFieldDisplayName(field);
      messages.push(`${fieldName}: ${error}`);
    }
  }

  return messages.join("; ");
}

function getFieldDisplayName(field: string): string {
  const names: Record<string, string> = {
    date: "Tanggal",
    slotId: "Jadwal",
    partySize: "Jumlah orang",
    name: "Nama",
    phone: "Nomor telepon",
    email: "Email",
    menuItems: "Item menu",
  };
  return names[field] || field;
}

function getPhoneErrorDetail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) {
    return `Nomor telepon terlalu pendek (${digits.length} digit, minimal 8)`;
  }
  if (digits.length > 13) {
    return `Nomor telepon terlalu panjang (${digits.length} digit, maksimal 13)`;
  }
  if (!/^(\+?62|0)8/.test(phone)) {
    return "Nomor telepon harus diawali 08 atau +628";
  }
  if (!/^(\+?62|0)8[0-9]{6,11}$/.test(phone.replace(/\D/g, ""))) {
    return "Format nomor tidak valid (contoh: 081234567890)";
  }
  return "Format nomor telepon tidak valid";
}

const bookingIntake = new BookingIntake(productionAdapter);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Normalize phone before validation
    if (body.phone) {
      body.phone = body.phone.replace(/^0/, "+62");
    }

    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const detailedMessage = formatZodError(fieldErrors);

      // Add specific phone error detail if phone field has error
      let phoneDetail = "";
      if (fieldErrors.phone && body.phone) {
        phoneDetail = getPhoneErrorDetail(body.phone);
      }

      return NextResponse.json(
        {
          error: "Data tidak valid",
          message: detailedMessage,
          phoneDetail,
          details: fieldErrors,
        },
        { status: 400 },
      );
    }

    // Validate email format if provided
    const email = parsed.data.email;
    if (email && email !== "" && !emailRegex.test(email)) {
      return NextResponse.json(
        {
          error: "Data tidak valid",
          message: "Email: Format email tidak valid (contoh: nama@domain.com)",
          details: { email: ["Format email tidak valid"] },
        },
        { status: 400 },
      );
    }

    const result = await bookingIntake.accept({
      ...parsed.data,
      email: email && email !== "" ? email : undefined,
      menuItems: parsed.data.menuItems,
    });

    revalidatePath("/booking");
    return NextResponse.json(
      {
        booking: result.booking,
        orders: result.orders,
        redirectUrl: `/booking/success?code=${result.booking.code}&phone=${encodeURIComponent(result.booking.phone)}`,
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
    const { getBooking } = await import("@/lib/bookings");
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