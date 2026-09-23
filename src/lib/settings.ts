import { prisma } from "./db";


export interface PickupWindow {
  start: string;
  end: string;
}

export interface DeliveryZone {
  zone: string;
  baseFee: number;
  perKm: number;
  maxKm: number;
  freeMin: number;
}

async function getRaw(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getPickupWindows(): Promise<PickupWindow[]> {
  const raw = await getRaw("pickupWindows");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PickupWindow[];
  } catch {
    return [];
  }
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const raw = await getRaw("deliveryZones");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DeliveryZone[];
  } catch {
    return [];
  }
}

export async function getTransferInfo(): Promise<string | null> {
  return getRaw("transferBank");
}

export async function getOrderCutoffHour(): Promise<number> {
  const raw = await getRaw("orderCutoffHour");
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n < 24 ? n : 16;
}

export async function getBookingLeadHours(): Promise<number> {
  const raw = await getRaw("bookingLeadHours");
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

export async function getPickupDateOptions(
  count: number = 14,
): Promise<{ date: string; label: string }[]> {
  const now = new Date();
  const options: { date: string; label: string }[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (isTargetClosed(d)) continue;
    options.push({
      date: formatDateYMD(d),
      label: formatDateLong(d),
    });
  }
  return options;
}

// A tiny hardoced closed-day rule (can later come from settings). We treat
// the shop as closed on Sunday by default. This matches a common Toko Mini Moni style.
function isTargetClosed(d: Date): boolean {
  // 0 = Sunday
  const day = d.getDay();
  if (day === 0) return true;
  return false;
}

export function formatDateYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatDateLong(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/**
 * Compute the latest allowed pickup/booking date given a cutoff hour and
 * lead-time requirement. Returns an ISO date string (YYYY-MM-DD).
 */
export async function latestAllowedBookingDate(): Promise<string> {
  const now = new Date();
  const wib = toWIB(now);
  // Pull configurable values (fallbacks are applied inside the helpers)
  const [cutoffHour, leadHours] = await Promise.all([
    getOrderCutoffHour(),
    getBookingLeadHours(),
  ]);
  const dayOffset = wib.getHours() >= cutoffHour ? 1 : 0;
  const d = new Date(wib);
  d.setDate(d.getDate() + dayOffset + leadHours);
  d.setHours(0, 0, 0, 0);
  return formatDateYMD(d);
}

/**
 * Convert a Date to WIB (Asia/Jakarta, UTC+7) without external deps.
 * Note: this is a best-effort fixed-offset conversion; for absolute
 * correctness we would need an IANA TZ. Since the environment may or may
 * may not have TZ data, we use UTC+7 explicitly and document the tradeoff.
 */
export function toWIB(date: Date): Date {
  const utc = date.getTime();
  return new Date(utc + 7 * 60 * 60 * 1000);
}

export function fromWIBString(isoDate: string): Date {
  return new Date(isoDate + "T00:00:00+07:00");
}

/**
 * Parse a YYYY-MM-DD calendar date to **UTC midnight** of that day.
 *
 * This is the representation for `@db.Date` columns (Booking.date,
 * Order.pickupDate): Prisma serializes a Date into a date column using its
 * UTC calendar day, so the WIB-midnight instant from `fromWIBString`
 * ("D T00:00+07:00") gets stored as D-1 — one day earlier than the day the
 * customer picked. Keep `fromWIBString` for real instants only (e.g.
 * `createdAt` range filters); use this for calendar dates.
 */
export function parseYMD(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** Shift a YYYY-MM-DD string by whole days (timezone-independent). */
export function addDaysToYMD(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateYMD(d);
}

/** Whole days from `a` to `b` (b - a) for YYYY-MM-DD strings. */
export function daysBetweenYMD(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${b}T00:00:00.000Z`) - Date.parse(`${a}T00:00:00.000Z`)) / 86_400_000,
  );
}

/** Today's calendar date in WIB (YYYY-MM-DD), timezone-independent. */
export function wibToday(): string {
  return formatDateYMD(toWIB(new Date()));
}

/** Tomorrow's calendar date in WIB (YYYY-MM-DD), timezone-independent. */
export function wibTomorrow(): string {
  return addDaysToYMD(wibToday(), 1);
}

export async function getWhatsAppNumber(): Promise<string> {
  const raw = await getRaw("waNumber");
  return raw || "6281234567890";
}

export async function getCustomerFacingSettings(): Promise<{
  pickupWindows: PickupWindow[];
  deliveryZones: DeliveryZone[];
  transferInfo: string | null;
  waNumber: string;
}> {
  const [windows, zones, transferInfo, waNumber] = await Promise.all([
    getPickupWindows(),
    getDeliveryZones(),
    getTransferInfo(),
    getWhatsAppNumber(),
  ]);
  return { pickupWindows: windows, deliveryZones: zones, transferInfo, waNumber };
}
