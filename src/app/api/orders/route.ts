import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createOrderSchema } from "@/validations/orders";
import { orderIntake, OrderIntakeError } from "@/lib/order-intake";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");

  if (!phone) {
    return NextResponse.json(
      { error: "Nomor telepon wajib diisi" },
      { status: 400 },
    );
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        customerPhone: phone,
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
    items: "Item pesanan",
    type: "Jenis pengambilan",
    customerName: "Nama pelanggan",
    customerPhone: "Nomor telepon",
    customerEmail: "Email",
    paymentMethod: "Metode pembayaran",
    pickupDate: "Tanggal pengambilan",
    pickupWindow: "Jadwal pengambilan",
    deliveryAddress: "Alamat pengiriman",
    deliveryZone: "Zona pengiriman",
    paymentProofUrl: "Bukti pembayaran",
    isCustomCake: "Kue custom",
    customText: "Teks kustom",
    customDesign: "Desain kustom",
    customPhotoUrl: "Foto referensi kustom",
    notes: "Catatan",
  };
  return names[field] || field;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const detailedMessage = formatZodError(fieldErrors);

      return NextResponse.json(
        {
          error: "Data tidak valid",
          message: detailedMessage,
          details: fieldErrors,
        },
        { status: 400 },
      );
    }

    const order = await orderIntake.accept({
      ...parsed.data,
      customerEmail: parsed.data.customerEmail && parsed.data.customerEmail !== "" ? parsed.data.customerEmail : undefined,
    });

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

    if (error instanceof OrderIntakeError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Gagal membuat pesanan";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}