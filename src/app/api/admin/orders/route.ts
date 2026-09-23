import { NextRequest, NextResponse } from "next/server";
import { getOrders, getOrderStats, ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { isAdminAuthenticated, adminUnauthorized } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  const scope = req.nextUrl.searchParams.get("scope") === "all" ? "all" : "today";
  const statusParam = req.nextUrl.searchParams.get("status");
  const status = ORDER_STATUSES.includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : undefined;

  try {
    const [orders, stats] = await Promise.all([
      getOrders({ scope, status }),
      getOrderStats(),
    ]);
    return NextResponse.json({ orders, stats });
  } catch (error) {
    console.error("GET /api/admin/orders failed:", error);
    return NextResponse.json({ error: "Gagal memuat pesanan" }, { status: 500 });
  }
}
