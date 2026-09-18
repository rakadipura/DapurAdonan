import { prisma } from "./db";
import type { CustomerType } from "@/types";
import { toWIB, fromWIBString, formatDateYMD, formatDateLong, latestAllowedBookingDate } from "./settings";
import { isValidPhone, normalizePhone } from "./regex";
import { formatRupiah } from "./money";
import { startOfDay, addDays, isWeekend } from "date-fns";

export interface CreateBookingInput {
  date: string; // YYYY-MM-DD in WIB
  slotId: number;
  partySize: number;
  name: string;
  phone: string;
}

export interface BookingWithSlot {
  id: number;
  code: string;
  date: string;
  slot: { id: number; name: string; startTime: string; endTime: string };
  partySize: number;
  name: string;
  phone: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  noShowAt: Date | null;
}

export interface SlotAvailability {
  slotId: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remaining: number;
}

export async function getAvailableSlots(date: string): Promise<SlotAvailability[]> {
  const wibDate = fromWIBString(date);

  // Count bookings for the given date and slot (only non-cancelled ones).
  const bookings = await prisma.booking.findMany({
    where: {
      date: wibDate,
      status: { not: "CANCELLED" },
      slotId: { not: null, not: 0 },
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

  return slots.map((s) => ({
    slotId: s.id,
    name: s.name,
    startTime: s.startTime,
    endTime: s.endTime,
    capacity: s.capacity,
    remaining: Math.max(0, s.capacity - (counts[s.id] || 0)),
  }));
}

export async function createBooking(input: CreateBookingInput): Promise<BookingWithSlot> {
  const { date, slotId, partySize, name, phone } = input;

  if (!isValidPhone(phone)) {
    throw new Error("Nomor telepon tidak valid");
  }
  if (partySize < 1 || partySize > 8) {
    throw new Error("Jumlah orang harus antara 1 dan 8");
  }

  const wibDate = fromWIBString(date);

  // Validate slot exists and is active.
  const slot = await prisma.bookingSlot.findUnique({ where: { id: slotId } });
  if (!slot || !slot.isActive) {
    throw new Error("Jadwal tidak tersedia");
  }

  // Validate date is not in the past (allow today if after cutoff).
  const nowWIB = toWIB(new Date());
  const todayStart = startOfDay(nowWIB);
  const dateStart = startOfDay(wibDate);
  const diffDays = (dateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) {
    throw new Error("Tanggal booking harus hari ini atau setelahnya");
  }

  // Validate against maxPartySize setting.
  const maxPartySize = await getMaxPartySize();
  if (partySize > maxPartySize) {
    throw new Error(`Jumlah orang melebihi batas maksimum (${maxPartySize})`);
  }

  // Transactional overbooking protection.
  const result = await prisma.$transaction(async (tx) => {
    // Re-count under the transaction.
    const bookings = await tx.booking.findMany({
      where: { date: wibDate, status: { not: "CANCELLED" }, slotId },
      select: { partySize: true },
    });
    const currentCount = bookings.reduce((sum, b) => sum + b.partySize, 0);
    const available = slot.capacity - currentCount;

    if (available < partySize) {
      throw new Error(`Jadwal penuh; hanya tersisa ${available} orang`);
    }

    const bookingCode = generateBookingCode();

    const booking = await tx.booking.create({
      data: {
        code: bookingCode,
        date: wibDate,
        slotId,
        partySize,
        name,
        phone: normalizePhone(phone),
        status: "PENDING",
        createdAt: new Date(),
      },
      include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
    });

    return booking;
  });

  return mapBookingWithSlot(result);
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

export async function updateBookingStatus(code: string, status: string): Promise<BookingWithSlot | null> {
  const booking = await prisma.booking.update({
    where: { code },
    data: {
      status,
      noShowAt: status === "NO_SHOW" ? new Date() : undefined,
      updatedAt: new Date(),
    },
    include: { slot: { select: { id: true, name: true, startTime: true, endTime: true } } },
  });

  if (!booking) return null;
  return mapBookingWithSlot(booking);
}

export async function getTodayBookings(): Promise<BookingWithSlot[]> {
  const nowWIB = toWIB(new Date());
  const todayStart = startOfDay(nowWIB);
  const tomorrowStart = addDays(todayStart, 1);

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
    if (isWeekend(d)) continue; // shop closed Sunday; Monday=Friday? We'll close Sunday only for MVP.
    options.push({
      date: formatDateYMD(d),
      label: formatDateLong(d),
    });
  }
  return options;
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
  status: string;
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
    status: booking.status,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    noShowAt: booking.noShowAt,
  };
}

async function getMaxPartySize(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "maxPartySize" } });
  const n = Number(row?.value);
  return Number.isFinite(n) && n > 0 ? n : 8;
}

let __bookingCodeCounter = 0;
function generateBookingCode(): string {
  _codeCounter += 1;
  __bookingCodeCounter += 1;
  const suffix = String(__bookingCodeCounter).padStart(6, "0");
  return `BKG-${suffix}`;
}
