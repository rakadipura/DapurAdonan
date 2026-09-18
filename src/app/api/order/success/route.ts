import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const phone = req.nextUrl.searchParams.get("phone");
  if (!code || !phone) {
    return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 });
  }
  // The page itself fetches the order; this endpoint is just a redirect target
  // if you want to prevalidate. For now, pass-through.
  return NextResponse.json({ code, phone });
}
