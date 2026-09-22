import { prisma } from "./db";
import type { CustomerType } from "@/types";
import { toWIB, fromWIBString, formatDateYMD, formatDateLong } from "./settings";


import { isValidPhone, normalizePhone } from "./regex";


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
  const wibDate = fromWIBString(date);

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
  const slot = await tx.bookingSlot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error("Slot not found");

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
    throw new Error(`Jadwal penuh; hanya tersisa ${available} orang`);
  }
}


export async function getBooking(code: string, phone: string): Promise<BookingWithSlot | null> {
  const booking = await prisma.booking.findUnique({
    where: { code },
    include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
  });

  if (!booking) return null;
  if (booking.phone !== normalizePhone(phone)) return null;
  return mapBookingWithSlot(booking);
}

export async function getBookingByCode(code: string): Promise<BookingWithSlot | null> {
  const booking = await prisma.booking.findUnique({
    where: { code },
    include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
  });

  if (!booking) return null;
  return mapBookingWithSlot(booking);
}

export async function cancelBooking(code: string, phone: string, reason?: string): Promise<BookingWithSlot | null> {
  const booking = await prisma.booking.findUnique({ where: { code } });
  if (!booking) return null;
  if (booking.phone !== normalizePhone(phone)) return null;

  const updated = await prisma.booking.update({
    where: { code },
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
  const booking = await prisma.booking.findUnique({ where: { code } });
  if (!booking) return null;
  if (booking.phone !== normalizePhone(phone)) return null;

  const wibDate = fromWIBString(newDate);

  const slot = await prisma.bookingSlot.findUnique({ where: { id: newSlotId } });
  if (!slot || !slot.isActive) {
    throw new Error("Jadwal baru tidak tersedia");
  }

  const nowWIB = toWIB(new Date());
  const todayStart = new Date(nowWIB.getFullYear(), nowWIB.getMonth(), nowWIB.getDate());
  const dateStart = new Date(wibDate.getFullYear(), wibDate.getMonth(), wibDate.getDate());
  const diffDays = (dateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) {
    throw new Error("Tanggal booking harus hari ini atau setelahnya");
  }

      const result = await prisma.$transaction(async (tx: import("@prisma/client").Prisma.TransactionClient) => {
        // Verify capacity via shared helper (exclude RESCHEDULED)
        await ensureSlotCapacity(tx, newSlotId, wibDate, booking.partySize);

        const updated = await tx.booking.update({
          where: { code },
          data: {
            date: wibDate,
            slotId: newSlotId,
            status: "RESCHEDULED",
            rescheduledFromId: booking.id,
            rescheduledAt: new Date(),
            updatedAt: new Date(),
          },
          include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
        });

        return updated;
      });

  return mapBookingWithSlot(result);
}

export async function updateBookingStatus(code: string, status: BookingStatus): Promise<BookingWithSlot | null> {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new Error(`Status booking tidak valid: ${status}`);
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
    const nowWIB = toWIB(new Date());
    const todayStart = new Date(nowWIB.getFullYear(), nowWIB.getMonth(), nowWIB.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    where.date = { gte: todayStart, lt: tomorrowStart };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
    orderBy: { createdAt: "desc" },
  });

  return bookings.map(mapBookingWithSlot);
}

export async function getTodayBookings(): Promise<BookingWithSlot[]> {
  const nowWIB = toWIB(new Date());
  const todayStart = new Date(nowWIB.getFullYear(), nowWIB.getMonth(), nowWIB.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: todayStart, lt: tomorrowStart },
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
  const nowWIB = toWIB(new Date());
  const todayStart = new Date(nowWIB.getFullYear(), nowWIB.getMonth(), nowWIB.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [todayBookings, pendingBookings, totalBookings] = await Promise.all([
    prisma.booking.count({
      where: { date: { gte: todayStart, lt: tomorrowStart }, status: { not: "CANCELLED" } },
    }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: { not: "CANCELLED" } } }),
  ]);

  return { todayBookings, pendingBookings, totalBookings };
}

export function generateWhatsAppLink(booking: BookingWithSlot): string {
  const waNumber = getWhatsAppNumber();
  const message = `Halo Toko Mini Moni, saya ingin konfirmasi booking meja:\n` +
    `Kode: ${booking.code}\n` +
    // Parse the stored YYYY‑MM‑DD string as a WIB date to avoid timezone shift
    `Tanggal: ${formatDateLong(fromWIBString(booking.date))}\n` +
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
  };
}

// Re-use the centralized helper from settings.ts
import { getMaxPartySize as getMaxPartySizeSetting } from "./settings";

// Legacy alias kept for backward compatibility (if any internal calls exist)
const getMaxPartySize = getMaxPartySizeSetting;

function generateBookingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}