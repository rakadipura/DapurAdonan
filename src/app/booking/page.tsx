import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAvailableSlots, getBookingDateOptions } from "@/lib/bookings";
import { getMaxPartySize, getBookingLeadHours, formatDateYMD, formatDateLong } from "@/lib/settings";
import { SessionProvider } from "@/components/customer/SessionProvider";
import { BookingFlow } from "@/components/customer/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Booking Meja — Toko Mini Moni",
  description: "Book a table for Toko Mini Moni. Choose a date, time slot, and party size.",
};

export default async function BookingPage() {
  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL == null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-red-600">
        Database not configured.
      </div>
    );
  }

  const [categories, products, slots, dateOptions, maxPartySize, leadHours] = await Promise.all([
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        dailyStock: true,
        isAvailable: true,
        category: { select: { name: true } },
      },
    }),
    prisma.bookingSlot.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, startTime: true, endTime: true, capacity: true },
    }),
    getBookingDateOptions(14),
    getMaxPartySize(),
    getBookingLeadHours(),
  ]);

  // Add price field for compatibility with Product type
  const productsWithPrice = products.map((p) => ({ ...p, price: p.basePrice }));

  // Pick tomorrow's date as the example / default for the form placeholder.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = formatDateYMD(tomorrow);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#fffaf0] px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <header className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
              ← Kembali ke Toko Mini Moni
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-[#6b4a2b]">Booking Meja</h1>
            <p className="mt-2 text-base text-[#5a4a3a]">
              Pilih tanggal dan waktu untuk makan bersama di Toko Mini Moni.
              Hanya tersedia hingga {String(maxPartySize)} orang per meja.
            </p>
          </header>

          <BookingFlow
            categories={categories}
            products={productsWithPrice}
            slots={slots}
            dateOptions={dateOptions}
            maxPartySize={maxPartySize}
            leadHours={leadHours}
            defaultDate={defaultDate}
          />
        </div>
      </div>
    </SessionProvider>
  );
}
