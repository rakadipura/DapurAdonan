import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Toko Mini Moni — Roti, Kue, dan Jajanan Sehat",
  description:
    "Toko Mini Moni menyediakan roti tawar, kue kering, ronde kue, dan minuman segar. Pesan untuk diambil atau dikirim.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fffaf0] px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2"
          >
            ← Kembali ke Toko Mini Moni
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-[#6b4a2b]">
            Toko Mini Moni
          </h1>
          <p className="mt-2 text-lg text-[#5a4a3a]">
            Roti tawar, kue kering, ronde kue, dan minuman segar — dibuat dengan
            bahan pilihan dan diracik sendiri.
          </p>
        </header>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center rounded-xl border-0 bg-[#A0522D] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8b4513]"
          >
            Lihat Menu & Pemesanan
          </Link>
          <Link
            href="/booking"
            className="inline-flex items-center justify-center rounded-xl border border-[#e6c98a] bg-white px-8 py-3 text-sm font-semibold text-[#6b4a2b] shadow-sm transition hover:border-[#A0522D]"
          >
            Booking Meja
          </Link>
        </div>

        {/* Info cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#efe2c7] bg-white p-4 text-left">
            <p className="text-sm font-semibold text-[#6b4a2b]">Jam Operasional</p>
            <p className="mt-1 text-sm text-[#5a4a3a]">09.00 – 17.00 WIB</p>
            <p className="text-xs text-[#5a4a3a]">Setiap hari</p>
          </div>
          <div className="rounded-xl border border-[#efe2c7] bg-white p-4 text-left">
            <p className="text-sm font-semibold text-[#6b4a2b]">Pemesanan</p>
            <p className="mt-1 text-sm text-[#5a4a3a]">Online atau via WhatsApp</p>
            <p className="text-xs text-[#5a4a3a]">0812-3456-7890</p>
          </div>
          <div className="rounded-xl border border-[#efe2c7] bg-white p-4 text-left">
            <p className="text-sm font-semibold text-[#6b4a2b]">Status Pesanan</p>
            <p className="mt-1 text-sm text-[#5a4a3a]">Cek kode + nomor telepon</p>
            <p className="text-xs text-[#5a4a3a]">/order/status</p>
          </div>
          <div className="rounded-xl border border-[#efe2c7] bg-white p-4 text-left">
            <p className="text-sm font-semibold text-[#6b4a2b]">Riwayat Pesanan</p>
            <p className="mt-1 text-sm text-[#5a4a3a]">Lihat semua pesanan Anda</p>
            <Link
              href="/account/orders"
              className="mt-2 inline-block text-xs font-medium text-[#A0522D] underline underline-offset-2 hover:text-[#8b4513]"
            >
              Masuk ke riwayat →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#efe2c7] pt-6 text-center text-xs text-[#5a4a3a]">
          <p>Toko Mini Moni · Hadir setiap hari untuk kebutuhan jajanan Anda.</p>
          <p>Hubungi kami: 0812-3456-7890</p>
        </footer>
      </div>
    </div>
  );
}
