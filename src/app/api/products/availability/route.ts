import { NextRequest, NextResponse } from "next/server";
import { getProductAvailability } from "@/lib/orders";

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "productId wajib diisi" }, { status: 400 });
  }

  try {
    const availability = await getProductAvailability(parseInt(productId, 10));
    if (!availability) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ availability }, { status: 200 });
  } catch (error) {
    console.error("GET /api/products/availability failed:", error);
    return NextResponse.json({ error: "Gagal memuat ketersediaan produk" }, { status: 500 });
  }
}