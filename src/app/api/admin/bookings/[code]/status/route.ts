import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BookingIntake, productionAdapter } from "@/lib/booking-intake";
import { BookingIntakeError } from "@/lib/booking-intake/types";
import { isAdminAuthenticated, adminUnauthorized } from "@/lib/admin-auth";

const schema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "RESCHEDULED", "NO_SHOW", "COMPLETED"]),
});

const bookingIntake = new BookingIntake(productionAdapter);

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  const { code } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: "Status tidak valid", details: fieldErrors },
      { status: 400 },
    );
  }

  try {
    const booking = await bookingIntake.updateStatus({ code, status: parsed.data.status });
    return NextResponse.json({ booking });
  } catch (error) {
    console.error("POST /api/admin/bookings/[code]/status failed:", error);
    if (error instanceof BookingIntakeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Gagal memperbarui status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
