import { prisma } from "./db";
import {
  formatDateYMD,
  formatDateLong,
  getWhatsAppNumber,
  parseYMD,
  wibToday,
  wibTomorrow,
  getClosedDaysConfig,
} from "./settings";

import { normalizePhone } from "./regex";


export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "NO_SHOW"
  | "COMPLETED";

export const BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "RESCHEDULED",
  "NO_SHOW",
  "COMPLETED",
];

export interface CreateBookingInput {
  date: string; // YYYY-MM-DD in WIB
  slotId: number;
  partySize: number;
  name: string;
  phone: string;
  email?: string;
}

export interface BookingWithSlot {
  id: number;
  code: string;
  date: string;
  slot: { id: number; name: string; startTime: string; endTime: string };
  partySize: number;
  name: string;
  phone: string;
  email?: string;
  status: string;
  cancelledAt?: Date;
  cancelReason?: string;
  rescheduledFromId?: number;
  rescheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  noShowAt: Date | null;
  preOrders?: Array<{
    id: number;
    code: string;
    total: number;
    status: string;
    items: Array<{
      productName: string;
      variantName: string | null;
      qty: number;
      price: number;
    }>;
  }>;
}

export interface SlotAvailability {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remaining: number;
}

export async function getAvailableSlots(date: string): Promise<SlotAvailability[]> {
  const wibDate = parseYMD(date);

  const bookings = await prisma.booking.findMany({
    where: {
      date: wibDate,
      status: { notIn: ["CANCELLED", "NO_SHOW", "RESCHEDULED"] },
    },
    select: { slotId: true, partySize: true, status: true },
  });

  const slots = await prisma.bookingSlot.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  const counts: Record<number, number> = {};
  for (const b of bookings) {
    counts[b.slotId] = (counts[b.slotId] || 0) + b.partySize;
  }

  return slots.map((s: { id: number; name: string; startTime: string; endTime: string; capacity: number }) => ({
    id: s.id,
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    remaining: Math.max(0, s.capacity - (counts[s.id] || 0)),
  }));
}

async function ensureSlotCapacity(
  tx: import("@prisma/client").Prisma.TransactionClient,
  slotId: number,
  wibDate: Date,
  requiredSize: number,
): Promise<void> {
  // Serialize concurrent capacity checks for the same slot. Without this row
  // lock, two transactions under READ COMMITTED can both read the same
  // pre-insert booking count and together exceed the slot capacity.
  await tx.$queryRaw`SELECT id FROM "BookingSlot" WHERE id = ${slotId} FOR UPDATE`;

  const slot = await tx.bookingSlot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error(`Slot booking dengan ID ${slotId} tidak ditemukan`);

  const existing = await tx.booking.findMany({
    where: {
      date: wibDate,
      slotId,
      status: { notIn: ["CANCELLED", "NO_SHOW", "RESCHEDULED"] },
    },
    select: { partySize: true },
  });
  const occupied = existing.reduce((sum, b) => sum + b.partySize, 0);
  const available = slot.capacity - occupied;
  if (available < requiredSize) {
    throw new Error(
      `Jadwal penuh untuk slot ${slot.name} (${slot.startTime}-${slot.endTime}) pada tanggal ${wibDate.toISOString().slice(0, 10)}; hanya tersisa ${available} orang dari kapasitas ${slot.capacity}, butuh ${requiredSize}`
    );
  }
}


export async function createBooking(input: CreateBookingInput): Promise<BookingWithSlot> {
  const wibDate = parseYMD(input.date);

  const slot = await prisma.bookingSlot.findUnique({ where: { id: input.slotId } });
  if (!slot) {
    throw new Error(`Slot booking dengan ID ${input.slotId} tidak ditemukan`);
  }
  if (!slot.isActive) {
    throw new Error(`Slot booking "${slot.name}" (${slot.startTime}-${slot.endTime}) tidak aktif`);
  }

  const todayStr = wibToday();
  if (input.date < todayStr) {
    throw new Error(
      `Tanggal booking (${input.date}) tidak valid: harus hari ini atau setelahnya. Hari ini: ${todayStr}`
    );
  }

  // Validate closed days
  const closedDaysConfig = await getClosedDaysConfig();
  const closedDays = new Set(closedDaysConfig.closedDays);
  const inputDate = parseYMD(input.date);
  if (closedDays.has(inputDate.getDay())) {
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    throw new Error(
      `Tanggal booking (${input.date}) tidak valid: ${dayNames[inputDate.getDay()]} adalah hari tutup`
    );
  }

  // Party size is capped by this slot's seat capacity (maintained per slot
  // from the admin panel); the remaining-seat check happens inside
  // ensureSlotCapacity, within the transaction.
  if (input.partySize < 1) {
    throw new Error("Jumlah orang minimal 1");
  }
  if (input.partySize > slot.capacity) {
    throw new Error(`Jumlah orang (${input.partySize}) melebihi kapasitas jadwal (${slot.capacity} kursi)`);
  }

  const code = await generateUniqueBookingCode();

  const result = await prisma.$transaction(async (tx) => {
    await ensureSlotCapacity(tx, input.slotId, wibDate, input.partySize);

    const booking = await tx.booking.create({
      data: {
        code,
        date: wibDate,
        slotId: input.slotId,
        partySize: input.partySize,
        name: input.name,
        phone: normalizePhone(input.phone),
        email: input.email || null,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
    });

    return booking;
  });

  if (!result) throw new Error("Booking creation failed: data tidak tersimpan");
  return mapBookingWithSlot(result);
}

async function generateUniqueBookingCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const existing = await prisma.booking.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Gagal generate kode booking unik");
}

/** Row shape accepted by mapBookingWithSlot (a Booking plus its slot). */
type BookingRow = Parameters<typeof mapBookingWithSlot>[0];

/**
 * Look up a booking by code and follow its reschedule chain to the currently
 * active booking.
 *
 * Rescheduling supersedes the old row (status RESCHEDULED, excluded from
 * capacity counts) and creates a new row pointing back at it via
 * rescheduledFromId. Customer-facing codes therefore always resolve forward
 * to the booking that is actually happening.
 */
async function resolveActiveBooking(code: string): Promise<BookingRow | null> {
  const slotSelect = { select: { id: true, name: true, startTime: true, endTime: true } } as const;

  let booking: BookingRow | null = await prisma.booking.findUnique({
    where: { code },
    include: { slot: slotSelect },
  });
  if (!booking) return null;

  const seen = new Set<number>();
  while (booking.status === "RESCHEDULED") {
    if (seen.has(booking.id)) break; // cycle guard
    seen.add(booking.id);

    const next: BookingRow | null = await prisma.booking.findFirst({
      where: { rescheduledFromId: booking.id },
      include: { slot: slotSelect },
      orderBy: { createdAt: "desc" },
    });
    if (!next) break; // superseded but no successor found – return as-is
    booking = next;
  }

  return booking;
}

export async function getBooking(code: string, phone: string): Promise<BookingWithSlot | null> {
  const booking = await resolveActiveBooking(code);

  if (!booking) return null;
  if (booking.phone !== normalizePhone(phone)) return null;
  return mapBookingWithSlot(booking);
}

export async function getBookingByCode(code: string): Promise<BookingWithSlot | null> {
  const booking = await resolveActiveBooking(code);
  if (!booking) return null;
  return mapBookingWithSlot(booking);
}

export async function cancelBooking(code: string, phone: string, reason?: string): Promise<BookingWithSlot | null> {
  const booking = await resolveActiveBooking(code);
  if (!booking) return null;
  if (booking.phone !== normalizePhone(phone)) return null;

  if (booking.status === "CANCELLED") return mapBookingWithSlot(booking); // idempotent
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    throw new Error(`Booking dengan status ${booking.status} tidak dapat dibatalkan`);
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: reason,
      updatedAt: new Date(),
    },
    include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
  });

  return mapBookingWithSlot(updated);
}

export async function rescheduleBooking(
  code: string,
  phone: string,
  newDate: string,
  newSlotId: number
): Promise<BookingWithSlot | null> {
  const booking = await resolveActiveBooking(code);
  if (!booking) return null;
  if (booking.phone !== normalizePhone(phone)) return null;

  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    throw new Error(`Booking dengan status ${booking.status} tidak dapat dijadwal ulang`);
  }

  const wibDate = parseYMD(newDate);

  const slot = await prisma.bookingSlot.findUnique({ where: { id: newSlotId } });
  if (!slot) {
    throw new Error(`Slot booking baru dengan ID ${newSlotId} tidak ditemukan`);
  }
  if (!slot.isActive) {
    throw new Error(`Slot booking baru "${slot.name}" (${slot.startTime}-${slot.endTime}) tidak aktif`);
  }

  const todayStr = wibToday();
  if (newDate < todayStr) {
    throw new Error(
      `Tanggal booking baru (${newDate}) tidak valid: harus hari ini atau setelahnya. Hari ini: ${todayStr}`
    );
  }

  const newCode = await generateUniqueBookingCode();

  const result = await prisma.$transaction(async (tx: import("@prisma/client").Prisma.TransactionClient) => {
        // Verify capacity via shared helper (locks the slot row; excludes
        // superseded RESCHEDULED rows)
        await ensureSlotCapacity(tx, newSlotId, wibDate, booking.partySize);

        // 1) Supersede the old row. It keeps its original date/slot as an
        //    audit trail and stops counting toward capacity.
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "RESCHEDULED",
            rescheduledAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // 2) Create the new active booking, linked back to the original one.
        const created = await tx.booking.create({
          data: {
            code: newCode,
            date: wibDate,
            slotId: newSlotId,
            partySize: booking.partySize,
            name: booking.name,
            phone: booking.phone,
            email: booking.email,
            status: "PENDING",
            rescheduledFromId: booking.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
        });

        return created;
      });

  return mapBookingWithSlot(result);
}

export async function updateBookingStatus(code: string, status: BookingStatus): Promise<BookingWithSlot | null> {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new Error(
      `Status booking tidak valid: "${status}". Status yang diperbolehkan: ${BOOKING_STATUSES.join(", ")}`
    );
  }

  try {
    const booking = await prisma.booking.update({
      where: { code },
      data: {
        status,
        noShowAt: status === "NO_SHOW" ? new Date() : undefined,
        updatedAt: new Date(),
      },
      include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
    });
    return mapBookingWithSlot(booking);
  } catch {
    return null;
  }
}

export interface BookingListFilter {
  status?: BookingStatus;
  /** "today" (default) restricts to bookings dated today (WIB); "all" returns everything. */
  scope?: "today" | "all";
}

/** List bookings for the admin dashboard, newest first. */
export async function getBookings(filter: BookingListFilter = {}): Promise<BookingWithSlot[]> {
  const { status, scope = "today" } = filter;

  const where: { status?: BookingStatus; date?: { gte: Date; lt: Date } } = {};
  if (status) where.status = status;
  if (scope === "today") {
    where.date = { gte: parseYMD(wibToday()), lt: parseYMD(wibTomorrow()) };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      slot: { select: { id: true, name: true, startTime: true, endTime: true } },
      preOrders: {
        include: {
          itemsOrder: {
            include: {
              product: { select: { name: true } },
              variant: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return bookings.map(mapBookingWithSlot);
}

export async function getTodayBookings(): Promise<BookingWithSlot[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: parseYMD(wibToday()), lt: parseYMD(wibTomorrow()) },
    },
    include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
    orderBy: { createdAt: "desc" },
  });

  return bookings.map(mapBookingWithSlot);
}

export async function getBookingDateOptions(days: number = 14): Promise<{ date: string; label: string }[]> {
  const now = new Date();
  const options: { date: string; label: string }[] = [];
  for (let i = 1; i <= days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0) continue;
    options.push({
      date: formatDateYMD(d),
      label: formatDateLong(d),
    });
  }
  return options;
}

export async function getBookingStats() {
  const todayStart = parseYMD(wibToday());
  const tomorrowStart = parseYMD(wibTomorrow());

  const [todayBookings, pendingBookings, totalBookings] = await Promise.all([
    prisma.booking.count({
      where: { date: { gte: todayStart, lt: tomorrowStart }, status: { notIn: ["CANCELLED", "RESCHEDULED"] } },
    }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: { notIn: ["CANCELLED", "RESCHEDULED"] } } }),
  ]);

  return { todayBookings, pendingBookings, totalBookings };
}

export function generateWhatsAppLink(booking: BookingWithSlot): string {
  const waNumber = getWhatsAppNumber();
  const message = `Halo Toko Mini Moni, saya ingin konfirmasi booking meja:\n` +
    `Kode: ${booking.code}\n` +
    // Parse the stored YYYY‑MM‑DD string as a WIB date to avoid timezone shift
    `Tanggal: ${formatDateLong(parseYMD(booking.date))}\n` +
    `Waktu: ${booking.slot.startTime}-${booking.slot.endTime}\n` +
    `Jumlah orang: ${booking.partySize}\n` +
    `Nama: ${booking.name}\n` +
    `Status: ${booking.status}`;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}

// ---- helpers ----

function mapBookingWithSlot(booking: {
  id: number;
  code: string;
  date: Date;
  slotId: number;
  partySize: number;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  cancelledAt: Date | null;
  cancelReason: string | null;
  rescheduledFromId: number | null;
  rescheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  noShowAt: Date | null;
  slot: { id: number; name: string; startTime: string; endTime: string };
  preOrders?: Array<{
    id: number;
    code: string;
    total: number;
    status: string;
    itemsOrder: Array<{
      product: { name: string } | null;
      variant: { name: string } | null;
      qty: number;
      price: number;
    }>;
  }>;
}): BookingWithSlot {
  return {
    id: booking.id,
    code: booking.code,
    date: booking.date.toISOString().slice(0, 10),
    slot: booking.slot,
    partySize: booking.partySize,
    name: booking.name,
    phone: booking.phone,
    email: booking.email || undefined,
    status: booking.status,
    cancelledAt: booking.cancelledAt || undefined,
    cancelReason: booking.cancelReason || undefined,
    rescheduledFromId: booking.rescheduledFromId || undefined,
    rescheduledAt: booking.rescheduledAt || undefined,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    noShowAt: booking.noShowAt,
    preOrders: booking.preOrders?.map((order) => ({
      id: order.id,
      code: order.code,
      total: order.total,
      status: order.status,
      items: order.itemsOrder.map((item) => ({
        productName: item.product?.name ?? "Unknown",
        variantName: item.variant?.name ?? null,
        qty: item.qty,
        price: item.price,
      })),
    })),
  };
}