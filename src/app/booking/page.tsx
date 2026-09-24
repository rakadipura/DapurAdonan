import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAvailableSlots, getBookingDateOptions } from "@/lib/bookings";
import { getBookingLeadHours, formatDateYMD } from "@/lib/settings";
import { getCustomerFacingSettings } from "@/lib/settings";
import { SessionProvider } from "@/components/customer/SessionProvider";
import { BookingFlow } from "@/components/customer/booking/BookingFlow";
import { SiteHeader } from "@/components/customer/layout/SiteHeader";
import { SiteFooter } from "@/components/customer/layout/SiteFooter";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const [categories, products, slots, dateOptions, leadHours, settings] = await Promise.all([
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
    getBookingLeadHours(),
    getCustomerFacingSettings(),
  ]);

  // Add price field for compatibility with Product type
  const productsWithPrice = products.map((p) => ({ ...p, price: p.basePrice }));

  // Pick tomorrow's date as the example / default for the form placeholder.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = formatDateYMD(tomorrow);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#fffaf0]">
        <SiteHeader storeName={settings.storeName} logoUrl={settings.logoUrl} active="booking" />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
          {/* Header */}
          <header className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
              ← Kembali ke Beranda
            </Link>
            <h1 className="mt-4 text-3xl font-bold text-[#6b4a2b]">Booking Meja</h1>
            <p className="mt-2 text-base text-[#5a4a3a]">
              Pilih tanggal dan jam untuk makan bersama di {settings.storeName}.
            </p>
          </header>

          <BookingFlow
            categories={categories}
            products={productsWithPrice}
            slots={slots}
            dateOptions={dateOptions}
            leadHours={leadHours}
            defaultDate={defaultDate}
          />
        </div>
        <SiteFooter storeName={settings.storeName} />
      </div>
    </SessionProvider>
  );
}
