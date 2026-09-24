import type { Metadata } from "next";
import Link from "next/link";
import { getBooking } from "@/lib/bookings";
import { formatRupiah } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking Berhasil — Toko Mini Moni",
};

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; phone?: string }>;
}) {
  const { code, phone } = await searchParams;

  let booking = null;

  if (code && phone) {
    booking = await getBooking(code as string, phone as string);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        {/* Header */}
        <header className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
            ← Kembali ke Beranda
          </Link>
        </header>

        {(!code || !phone) ? (
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-8 text-center">
            <p className="text-2xl font-bold text-[#6b4a2b]">Maaf, kode tidak lengkap.</p>
            <p className="mt-2 text-sm text-[#5a4a3a]">
              Silakan cek pesan Anda atau hubungi kami.
            </p>
          </div>
        ) : !booking ? (
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-8 text-center">
            <p className="text-2xl font-bold text-[#A0522D]">Booking tidak ditemukan</p>
            <p className="mt-2 text-sm text-[#5a4a3a]">
              Kode atau nomor telepon tidak cocok. Coba lagi atau hubungi kami.
            </p>
            <Link
              href="/booking"
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#A0522D] bg-white px-6 py-3 text-sm font-semibold text-[#6b4a2b] shadow-sm transition hover:border-[#8b4513]"
            >
              Kembali ke Booking
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success card */}
            <div className="rounded-2xl border border-[#e6c98a] bg-[#FFF6E6] p-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#A0522D] text-white text-2xl">
                ✅
              </div>
              <h1 className="text-2xl font-bold text-[#6b4a2b]">Booking Anda berhasil!</h1>
              <p className="mt-1 text-sm text-[#5a4a3a]">
                Terima kasih sudah membooking di Toko Mini Moni.
              </p>
            </div>

            {/* Code card */}
            <div className="rounded-2xl border border-[#efe2c7] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b4a2b]">Kode Referensi</span>
                <span className="ml-4 rounded-lg bg-[#fffaf0] px-3 py-1 text-sm font-mono font-bold text-[#A0522D]">
                  {booking.code}
                </span>
              </div>
              <p className="text-xs text-[#5a4a3a]">
                Simpan kode ini. Cek status booking dengan kode dan nomor telepon.
              </p>

              <div className="mt-6 space-y-3">
                <h2 className="text-sm font-semibold text-[#6b4a2b]">Detail Booking</h2>
                <div className="space-y-2 text-sm">
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
                    <span className="font-medium text-[#6b4a2b]">{booking.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5a4a3a]">Jadwal</span>
                    <span className="font-medium text-[#6b4a2b]">
                      {booking.slot.startTime} – {booking.slot.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5a4a3a]">Jumlah orang</span>
                    <span className="font-medium text-[#6b4a2b]">{booking.partySize} orang</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5a4a3a]">Status</span>
                    <span className="font-medium text-[#6b4a2b]">{booking.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <a
                href={`/booking/status?code=${encodeURIComponent(booking.code)}&phone=${encodeURIComponent(booking.phone)}`}
                className="inline-flex items-center justify-center rounded-xl border border-[#A0522D] bg-white px-6 py-3 text-sm font-semibold text-[#6b4a2b] shadow-sm transition hover:border-[#8b4513]"
              >
                Cek Status
              </a>
              <a
                href={`https://wa.me/${booking.phone.replace(/^0/, "62")}?text=Halo%20Toko%20Mini%20Moni,%20saya%20baru%20membooking%20meja%20dengan%20kode%20${encodeURIComponent(booking.code)}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl border-0 bg-[#A0522D] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8b4513]"
              >
                Konfirmasi via WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
    </div>
  );
}