import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { uploadDir } from "@/lib/uploads";

/**
 * Serves payment-proof files written by POST /api/payments/upload.
 *
 * The filename is validated against the exact shape the upload route
 * generates (UUID + allow-listed extension), so there is no path traversal,
 * and the Content-Type is derived from the known extension — never from the
 * stored bytes — with `X-Content-Type-Options: nosniff`.
 */

const FILENAME_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|pdf)$/i;

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(path.join(uploadDir(), filename));
    const ext = filename.split(".").pop()!.toLowerCase();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPES[ext],
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });
  }
}
