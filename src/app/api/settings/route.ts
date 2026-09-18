import { NextResponse } from "next/server";
import { getCustomerFacingSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getCustomerFacingSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("GET /api/settings failed:", error);
    return NextResponse.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
  }
}
