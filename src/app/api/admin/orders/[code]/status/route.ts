import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateOrderStatus, ORDER_STATUSES } from "@/lib/orders";
import { isAdminAuthenticated, adminUnauthorized } from "@/lib/admin-auth";

const schema = z.object({
  status: z.enum(ORDER_STATUSES as [string, ...string[]]),
});

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
    const order = await updateOrderStatus(code, parsed.data.status as (typeof ORDER_STATUSES)[number]);
    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error("POST /api/admin/orders/[code]/status failed:", error);
    const message = error instanceof Error ? error.message : "Gagal memperbarui status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
