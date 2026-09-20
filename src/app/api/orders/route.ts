import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/regex";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");

  if (!phone) {
    return NextResponse.json(
      { error: "Nomor telepon wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const normalizedPhone = normalizePhone(phone);

    const orders = await prisma.order.findMany({
      where: {
        customerPhone: normalizedPhone,
      },
      include: {
        itemsOrder: {
          include: {
            product: {
              select: { name: true },
            },
            variant: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((order) => ({
      code: order.code,
      status: order.status,
      type: order.type,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: order.total,
      isPaid: order.isPaid,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      pickupDate: order.pickupDate?.toISOString().slice(0, 10) ?? null,
      pickupWindow: order.pickupWindow,
      deliveryAddress: order.deliveryAddress,
      deliveryZone: order.deliveryZone,
      items: order.itemsOrder.map((item) => ({
        productName: item.product.name,
        qty: item.qty,
        price: item.price,
        variantName: item.variant?.name,
        addOns: item.selectedAddOns,
      })),
    }));

    return NextResponse.json({ orders: formattedOrders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders failed:", error);
    return NextResponse.json({ error: "Gagal memuat riwayat pesanan" }, { status: 500 });
  }
}