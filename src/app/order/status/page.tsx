import type { Metadata } from "next";
import { getOrder } from "@/lib/orders";
import { getBooking } from "@/lib/bookings";
import { formatRupiah } from "@/lib/money";

export const metadata: Metadata = {
  title: "Cek Status — Toko Mini Moni",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu konfirmasi",
  CONFIRMED: "Dikonfirmasi",
  BAKING: "Sedang dibakar",
  READY: "Siap diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; phone?: string }>;
}) {
  const { code, phone } = await searchParams;
  let order = null;
  let booking = null;
  let error = null;

  if (code && phone) {
    order = await getOrder(code, phone);
    booking = await getBooking(code, phone);
    if (!order && !booking) {
      error = "Kode atau nomor telepon tidak cocok.";
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf0] px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
            ← Kembali ke Toko Mini Moni
          </a>
          <h1 className="mt-4 text-2xl font-bold text-[#6b4a2b]">Cek Status</h1>
          <p className="mt-1 text-sm text-[#5a4a3a]">
            Masukkan kode referensi dan nomor telepon untuk melihat status.
          </p>
        </header>

        {/* Lookup form */}
        <form className="mb-6 rounded-2xl border border-[#efe2c7] bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Kode referensi</label>
              <input
                type="text"
                name="code"
                defaultValue={code}
                placeholder="Contoh: MM-000001"
                className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Nomor telepon</label>
              <input
                type="tel"
                name="phone"
                defaultValue={phone}
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
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {order && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#efe2c7] bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b4a2b]">Kode Referensi</span>
                <span className="ml-4 rounded-lg bg-[#fffaf0] px-3 py-1 text-sm font-mono font-bold text-[#A0522D]">
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
                  <div className="flex justify-between">
                    <span className="text-[#5a4a3a]">Alamat pengiriman</span>
                    <span className="font-medium text-[#6b4a2b]">{order.deliveryAddress}</span>
                  </div>
                )}
                {order.deliveryZone && (
                  <div className="flex justify-between">
                    <span className="text-[#5a4a3a]">Zona</span>
                    <span className="font-medium text-[#6b4a2b]">{order.deliveryZone}</span>
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

            <div className="rounded-2xl border border-[#efe2c7] bg-white p-4 text-center text-sm text-[#5a4a3a]">
              Pesanan akan kami konfirmasi setelah pembayaran kami terima.
              Jika ada pertanyaan, hubungi kami via WhatsApp: 0812-3456-7890.
            </div>
          </div>
        )}

        {booking && !order && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#efe2c7] bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b4a2b]">Kode Referensi</span>
                <span className="ml-4 rounded-lg bg-[#fffaf0] px-3 py-1 text-sm font-mono font-bold text-[#A0522D]">
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
              </div>
            </div>
          </div>
        )}

        {(!code || !phone) && (
          <div className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
            Masukkan kode dan nomor telepon di atas untuk memeriksa status.
          </div>
        )}

        <footer className="mt-10 border-t border-[#efe2c7] pt-6 text-center text-xs text-[#5a4a3a]">
          <p>Toko Mini Moni · 09.00 – 17.00 WIB</p>
        </footer>
      </div>
    </div>
  );
}
