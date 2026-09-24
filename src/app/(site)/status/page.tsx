import type { Metadata } from "next";
import Link from "next/link";
import { getCustomerFacingSettings } from "@/lib/settings";
import { getOrder } from "@/lib/orders";
import { getBooking } from "@/lib/bookings";
import { formatRupiah } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status Pesanan — Toko Mini Moni",
  description: "Masukkan kode referensi dan nomor telepon untuk memeriksa status pesanan Anda.",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu konfirmasi",
  CONFIRMED: "Dikonfirmasi",
  BAKING: "Sedang dibakar",
  READY: "Siap diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export default async function StatusPesananPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; phone?: string }>;
}) {
  const settings = await getCustomerFacingSettings();
  const { code, phone } = await searchParams;

  let order = null;
  let booking = null;
  let error: string | null = null;

  if (code && phone) {
    order = await getOrder(code, phone);
    booking = await getBooking(code, phone);
    if (!order && !booking) {
      error = "Kode atau nomor telepon tidak cocok.";
    }
  }

  return (

        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-2xl font-bold text-[#6b4a2b]">Status Pesanan</h1>
          <p className="mt-1 mb-6 text-sm text-[#5a4a3a]">
            Masukkan kode referensi dan nomor telepon untuk memeriksa status pesanan Anda.
          </p>

          {/* Lookup form (GET so URL is shareable) */}
          <form method="get" action="/status" className="mb-6 rounded-2xl border border-[#efe2c7] bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="mb-1 block text-sm font-medium text-[#6b4a2b]">Kode referensi</label>
                <input
                  id="code"
                  type="text"
                  name="code"
                  defaultValue={code ?? ""}
                  placeholder="Contoh: MM-000001"
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-[#6b4a2b]">Nomor telepon</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  defaultValue={phone ?? ""}
                  placeholder="081234567890"
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg border-0 bg-[#A0522D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8b4513]"
              >
                Cek Status
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {order && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#efe2c7] bg-white p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6b4a2b]">Kode Referensi</span>
                  <span className="ml-4 rounded-lg bg-[#fffaf0] px-3 py-1 font-mono text-sm font-bold text-[#A0522D]">
                    {order.code}
                  </span>
                </div>
                <div className="mb-4">
                  <span className="inline-block rounded-full bg-[#A0522D] px-3 py-1 text-xs font-semibold text-white">
                    {order.type === "PICKUP" ? "Pickup" : "Delivery"}
                  </span>
                  <span className="ml-2 inline-block rounded-full border border-[#A0522D] px-3 py-1 text-xs font-semibold text-[#6b4a2b]">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5a4a3a]">Pelanggan</span>
                    <span className="font-medium text-[#6b4a2b]">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5a4a3a]">Nomor telepon</span>
                    <span className="font-medium text-[#6b4a2b]">{order.customerPhone}</span>
                  </div>
                  {order.pickupDate && (
                    <div className="flex justify-between">
                      <span className="text-[#5a4a3a]">Tanggal pengambilan</span>
                      <span className="font-medium text-[#6b4a2b]">{order.pickupDate}</span>
                    </div>
                  )}
                  {order.pickupWindow && (
                    <div className="flex justify-between">
                      <span className="text-[#5a4a3a]">Jadwal</span>
                      <span className="font-medium text-[#6b4a2b]">{order.pickupWindow}</span>
                    </div>
                  )}
                  {order.deliveryAddress && (
                    <div className="flex justify-between gap-4">
                      <span className="shrink-0 text-[#5a4a3a]">Alamat pengiriman</span>
                      <span className="text-right font-medium text-[#6b4a2b]">{order.deliveryAddress}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[#efe2c7] pt-2">
                    <span className="font-semibold text-[#6b4a2b]">Total</span>
                    <span className="font-bold text-[#6b4a2b]">{formatRupiah(order.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5a4a3a]">Pembayaran</span>
                    <span className="font-medium text-[#6b4a2b]">
                      {order.isPaid ? "Sudah dibayar ✅" : "Menunggu pembayaran"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {booking && !order && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#efe2c7] bg-white p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#6b4a2b]">Kode Referensi</span>
                  <span className="ml-4 rounded-lg bg-[#fffaf0] px-3 py-1 font-mono text-sm font-bold text-[#A0522D]">
                    {booking.code}
                  </span>
                </div>
                <div className="mb-4">
                  <span className="inline-block rounded-full bg-[#A0522D] px-3 py-1 text-xs font-semibold text-white">
                    Booking Meja
                  </span>
                  <span className="ml-2 inline-block rounded-full border border-[#A0522D] px-3 py-1 text-xs font-semibold text-[#6b4a2b]">
                    {STATUS_LABELS[booking.status] ?? booking.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5a4a3a]">Nama</span>
                    <span className="font-medium text-[#6b4a2b]">{booking.name}</span>
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
                </div>
              </div>
            </div>
          )}

          {(!code || !phone) && !error && (
            <div className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
              Masukkan kode dan nomor telepon di atas untuk memeriksa status.
            </div>
          )}
        </main>
  );
}