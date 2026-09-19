import { z } from "zod";

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        variantId: z.number().int().positive().optional(),
        qty: z.number().int().min(1).max(99),
        notes: z.string().optional(),
        selectedAddOns: z.array(z.string()).optional(),
      }),
    )
    .min(1, "Pilih minimal satu produk"),
  type: z.enum(["PICKUP", "DELIVERY"]),
  customerName: z.string().trim().min(1, "Nama wajib diisi"),
  customerPhone: z
    .string()
    .trim()
    .min(1, "Nomor telepon wajib diisi")
    .regex(/^(\+?62|0)8[0-9]{7,11}$/, "Format nomor telepon tidak valid"),
  customerEmail: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
  paymentMethod: z.enum(["TRANSFER", "EWALLET", "CASH", "QRIS"]),
  notes: z.string().optional(),
  pickupDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
  pickupWindow: z
    .string()
    .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Format jadwal harus HH:mm-HH:mm")
    .optional(),
  deliveryAddress: z.string().trim().optional(),
  deliveryZone: z.string().optional(),
  paymentProofUrl: z.string().optional(),
  isCustomCake: z.boolean().optional(),
  customText: z.string().optional(),
  customDesign: z.string().optional(),
  customPhotoUrl: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;