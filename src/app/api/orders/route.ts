import { NextRequest, NextResponse } from "next/server";
import { createOrder, getOrder } from "@/lib/orders";
import { createOrderSchema } from "@/validations/orders";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const order = await createOrder(parsed.data);
    revalidatePath("/menu");
    return NextResponse.json(
      {
        order,
        redirectUrl: `/order/success?code=${order.code}&phone=${encodeURIComponent(order.customerPhone)}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/orders failed:", error);
    const message =
      error instanceof Error ? error.message : "Gagal membuat pesanan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!code || !phone) {
    return NextResponse.json({ error: "Kode dan nomor telepon wajib diisi" }, { status: 400 });
  }

  try {
    const order = await getOrder(code, phone);
    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders failed:", error);
    return NextResponse.json({ error: "Gagal memuat pesanan" }, { status: 500 });
  }
}
