import { z } from "zod";

export const createBookingSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
    slotId: z.number().int().positive(),
    // Sanity bound only — the real per-slot limit is BookingSlot.capacity
    // ("kursi tersedia", maintained from /admin/slots), enforced in createBooking.
    partySize: z.number().int().min(1).max(99, "Jumlah orang terlalu besar"),
    name: z.string().trim().min(1, "Nama wajib diisi"),
    phone: z
      .string()
      .trim()
      .min(1, "Nomor telepon wajib diisi")
      .regex(/^(\+?62|0)8[0-9]{6,11}$/, "Format nomor telepon tidak valid"),
    email: z.string().email("Format email tidak valid").or(z.literal(""))
      .optional(),
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;