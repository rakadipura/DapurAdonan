import { NextResponse } from "next/server";
import { confirmPayment } from "@/lib/orders";
import { isAdminAuthenticated, adminUnauthorized } from "@/lib/admin-auth";

export async function POST(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!(await isAdminAuthenticated())) return adminUnauthorized();

  const { code } = await params;

  try {
    const order = await confirmPayment(code);
    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error("POST /api/admin/orders/[code]/payment failed:", error);
    return NextResponse.json({ error: "Gagal mengonfirmasi pembayaran" }, { status: 500 });
  }
}
