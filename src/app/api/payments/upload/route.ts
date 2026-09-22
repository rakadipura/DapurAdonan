import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

/**
 * Simple file‑upload endpoint for payment proof URLs.
 * Accepts multipart/form‑data with a single `file` field.
 * Stores the file under a temporary folder (`/tmp/uploads`) and returns a
 * public‑url (file path) that can later be saved in the `Order.paymentProofUrl`
 * column. In production you would swap this for S3, Cloudinary, etc.
 */
export async function POST(req: NextRequest) {
  try {
    // Next.js runtime provides `request.formData()` to parse multipart bodies.
    const form = await req.formData();
    const file = form.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const ext = ".bin";
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = "/tmp/uploads";
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Simple public URL (in dev you can serve this folder statically).
    const publicUrl = `/uploads/${filename}`;

    // If an orderCode is supplied, attach the URL to that order.
    const orderCode = form.get("orderCode") as string | null;
    if (orderCode) {
      await prisma.order.update({
        where: { code: orderCode },
        data: { paymentProofUrl: publicUrl },
      });
    }

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (err) {
    console.error("Upload error", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
