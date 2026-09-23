import { NextRequest, NextResponse } from "next/server";
import { getBookings, getBookingStats, BOOKING_STATUSES, type BookingStatus } from "@/lib/bookings";
import { isAdminAuthenticated, adminUnauthorized } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  const scope = req.nextUrl.searchParams.get("scope") === "all" ? "all" : "today";
  const statusParam = req.nextUrl.searchParams.get("status");
  const status = BOOKING_STATUSES.includes(statusParam as BookingStatus)
    ? (statusParam as BookingStatus)
    : undefined;

  try {
    const [bookings, stats] = await Promise.all([
      getBookings({ scope, status }),
      getBookingStats(),
    ]);
    return NextResponse.json({ bookings, stats });
  } catch (error) {
    console.error("GET /api/admin/bookings failed:", error);
    return NextResponse.json({ error: "Gagal memuat booking" }, { status: 500 });
  }
}
