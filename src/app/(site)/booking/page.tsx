import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAvailableSlots, getBookingDateOptions } from "@/lib/bookings";
import { getBookingLeadHours, formatDateYMD, getCustomerFacingSettings } from "@/lib/settings";
import { BookingFlow } from "@/components/customer/booking/BookingFlow";

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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-2xl font-bold text-[#6b4a2b]">Booking Meja</h1>
          <p className="mt-1 mb-6 text-sm text-[#5a4a3a]">
            Pilih tanggal dan jam untuk makan bersama di {settings.storeName}.
          </p>

          <BookingFlow
            categories={categories}
            products={productsWithPrice}
            slots={slots}
            dateOptions={dateOptions}
            leadHours={leadHours}
            defaultDate={defaultDate}
            bookingMenuCategories={settings.bookingMenuCategories}
          />
    </div>
  );
}
