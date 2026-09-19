import { z } from "zod";

export const createBookingSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
    slotId: z.number().int().positive(),
    partySize: z.number().int().min(1).max(8),
    name: z.string().trim().min(1, "Nama wajib diisi"),
    phone: z
      .string()
      .trim()
      .min(1, "Nomor telepon wajib diisi")
      .regex(/^(\+?62|0)8[0-9]{7,11}$/, "Format nomor telepon tidak valid"),
    email: z
      .string()
      .email("Format email tidak valid")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.partySize >= 1 && data.partySize <= 8, {
    message: "Jumlah orang harus antara 1 dan 8",
    path: ["partySize"],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;