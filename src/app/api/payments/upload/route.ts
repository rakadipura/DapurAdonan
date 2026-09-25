import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { uploadDir } from "@/lib/uploads";

/**
 * Payment-proof upload endpoint.
 *
 * Accepts multipart/form-data with a single `file` field (and an optional
 * `orderCode` to attach the proof to an existing order).
 *
 * Hardening:
 *  - type allow-list (jpeg/png/webp/pdf) and 5 MB size limit
 *  - the stored extension is derived from the *validated* MIME type, never
 *    from the client-supplied filename, and the serving route always returns
 *    that same fixed Content-Type with `nosniff`
 *  - files live under UPLOAD_DIR (default `<cwd>/uploads`) so they survive
 *    restarts — swap for S3/Cloudinary when running serverless
 *
 * Returns `{ url, filename }`, where `url` is a working public URL served by
 * `GET /api/payments/proof/[filename]`.
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF." },
        { status: 415 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "File kosong" }, { status: 400 });
    }
    if (buffer.length > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5 MB" },
        { status: 413 },
      );
    }

    const filename = `${randomUUID()}${ext}`;
    const dir = uploadDir();
    await fs.mkdir(dir, { recursive: true }); // @turbopackIgnore: true
    await fs.writeFile(path.join(dir, filename), buffer); // @turbopackIgnore: true

    const publicUrl = `/api/payments/proof/${filename}`;

    // Optional: attach the proof to an existing order.
    const orderCode = form.get("orderCode");
    if (typeof orderCode === "string" && orderCode) {
      const order = await prisma.order.findUnique({ where: { code: orderCode } });
      if (!order) {
        return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
      }
      await prisma.order.update({
        where: { code: orderCode },
        data: { paymentProofUrl: publicUrl },
      });
    }

    return NextResponse.json({ url: publicUrl, filename }, { status: 201 });
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
