import type { Metadata } from "next";
import { getBooking, getBookingDateOptions } from "@/lib/bookings";
import { formatDateLong } from "@/lib/settings";
import { RescheduleForm } from "@/components/customer/booking/RescheduleForm";

export const metadata: Metadata = {
  title: "Status Booking — Toko Mini Moni",
};

export default async function BookingStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; phone?: string }>;
}) {
  const { code, phone } = await searchParams;

  let booking = null;
  let dateOptions: { date: string; label: string }[] = [];

  if (code && phone) {
    booking = await getBooking(code as string, phone as string);
    if (booking) {
      dateOptions = await getBookingDateOptions(14);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf0] px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
            ← Kembali ke Toko Mini Moni
          </a>
        </header>

        {(!code || !phone) ? (
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-8 text-center">
            <p className="text-2xl font-bold text-[#6b4a2b]">Maaf, kode tidak lengkap.</p>
            <p className="mt-2 text-sm text-[#5a4a3a]">
              Silakan masukkan kode booking dan nomor telepon.
            </p>
          </div>
        ) : !booking ? (
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-8 text-center">
            <p className="text-2xl font-bold text-[#A0522D]">Booking tidak ditemukan</p>
            <p className="mt-2 text-sm text-[#5a4a3a]">
              Kode atau nomor telepon tidak cocok. Coba lagi atau hubungi kami.
            </p>
            <a
              href="/booking"
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#A0522D] bg-white px-6 py-3 text-sm font-semibold text-[#6b4a2b] shadow-sm transition hover:border-[#8b4513]"
            >
              Kembali ke Booking
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status card */}
            <div className="rounded-2xl border border-[#efe2c7] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b4a2b]">Kode Booking</span>
                <span className="rounded-lg bg-[#fffaf0] px-3 py-1 text-sm font-mono font-bold text-[#A0522D]">
                  {booking.code}
                </span>
              </div>
              <p className="text-xs text-[#5a4a3a] mb-4">
                Status: <span className="font-medium text-[#6b4a2b] capitalize">{booking.status.toLowerCase()}</span>
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5a4a3a]">Nama</span>
                  <span className="font-medium text-[#6b4a2b]">{booking.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5a4a3a]">Nomor telepon</span>
                  <span className="font-medium text-[#6b4a2b]">{booking.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5a4a3a]">Tanggal</span>
                  <span className="font-medium text-[#6b4a2b]">{formatDateLong(new Date(booking.date))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5a4a3a]">Waktu</span>
                  <span className="font-medium text-[#6b4a2b]">
                    {booking.slot.startTime} – {booking.slot.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5a4a3a]">Jumlah orang</span>
                  <span className="font-medium text-[#6b4a2b]">{booking.partySize} orang</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-2xl border border-[#efe2c7] bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-[#6b4a2b]">Kelola Booking</h2>
              <div className="space-y-3">
                <a
                  href={`https://wa.me/${booking.phone.replace(/^0/, "62")}?text=Halo%20Toko%20Mini%20Moni,%20saya%20ingin%20konfirmasi%20booking%20meja%20dengan%20kode%20${encodeURIComponent(booking.code)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center rounded-lg border border-[#A0522D] bg-white px-4 py-3 text-sm font-semibold text-[#6b4a2b] transition hover:bg-[#fffaf0]"
                >
                  Konfirmasi via WhatsApp
                </a>

                {["PENDING", "CONFIRMED"].includes(booking.status) && (
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      const reason = formData.get("reason") as string;
                      const res = await fetch("/api/bookings/cancel", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code: booking.code, phone: booking.phone, reason: reason || undefined }),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        return data.error ?? "Gagal membatalkan";
                      }
                      return "Booking dibatalkan";
                    }}
                    className="w-full"
                  >
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      Batalkan Booking
                    </button>
                  </form>
                )}

                {["PENDING", "CONFIRMED"].includes(booking.status) && booking && (
                  <RescheduleForm booking={{ code: booking.code, phone: booking.phone, slotId: booking.slot.id, partySize: booking.partySize }} dateOptions={dateOptions} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-[#efe2c7] pt-6 text-center text-xs text-[#5a4a3a]">
          <p>Toko Mini Moni · Jam operasional 09.00 – 17.00 WIB</p>
          <p>Hubungi kami via WhatsApp: 0812-3456-7890</p>
        </footer>
      </div>
    </div>
  );
}