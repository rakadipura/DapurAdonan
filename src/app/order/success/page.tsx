import type { Metadata } from "next";
import { getOrder } from "@/lib/orders";
import { getBooking } from "@/lib/bookings";
import { formatRupiah } from "@/lib/money";
import { formatRupiah as fmt } from "@/lib/money";

export const metadata: Metadata = {
  title: "Pesan Berhasil — Toko Mini Moni",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { code?: string; phone?: string };
}) {
  const { code, phone } = searchParams;

  let order = null;
  let booking = null;

  if (code && phone) {
    order = await getOrder(code as string, phone as string);
    booking = await getBooking(code as string, phone as string);
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
              Silakan cek pesan Anda atau hubungi kami.
            </p>
          </div>
        ) : !order && !booking ? (
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-8 text-center">
            <p className="text-2xl font-bold text-[#A0522D]">Pesanan tidak ditemukan</p>
            <p className="mt-2 text-sm text-[#5a4a3a]">
              Kode atau nomor telepon tidak cocok. Coba lagi atau hubungi kami.
            </p>
            <a
              href="/"
              className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#A0522D] bg-white px-6 py-3 text-sm font-semibold text-[#6b4a2b] shadow-sm transition hover:border-[#8b4513]"
            >
              Kembali ke Menu
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success card */}
            <div className="rounded-2xl border border-[#e6c98a] bg-[#FFF6E6] p-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#A0522D] text-white text-2xl">
                ✅
              </div>
              <h1 className="text-2xl font-bold text-[#6b4a2b]">
                {order ? "Pesan Anda berhasil!" : "Booking Anda berhasil!"}
              </h1>
              <p className="mt-1 text-sm text-[#5a4a3a]">
                {order ? "Terima kasih sudah memesan di Toko Mini Moni." : "Terima kasih sudah membooking di Toko Mini Moni."}
              </p>
            </div>

            {/* Code card */}
            <div className="rounded-2xl border border-[#efe2c7] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-[#6b4a2b]">Kode Referensi</span>
                <span className="ml-4 rounded-lg bg-[#fffaf0] px-3 py-1 text-sm font-mono font-bold text-[#A0522D]">
                  {order ? order.code : booking!.code}
                </span>
              </div>
              <p className="text-xs text-[#5a4a3a]">
                Simpan kode ini. Cek status pesanan atau booking dengan kode dan nomor telepon.
              </p>

              {order && (
                <div className="mt-6 space-y-3">
                  <h2 className="text-sm font-semibold text-[#6b4a2b]">Detail Pesanan</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#5a4a3a]">Pelanggan</span>
                      <span className="font-medium text-[#6b4a2b]">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5a4a3a]">Nomor telepon</span>
                      <span className="font-medium text-[#6b4a2b]">{order.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5a4a3a]">Jenis</span>
                      <span className="font-medium text-[#6b4a2b]">
                        {order.type === "PICKUP" ? "Pickup (Ambil sendiri)" : "Delivery (Antar)"}
                      </span>
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
                  </div>

                  <h2 className="mt-6 text-sm font-semibold text-[#6b4a2b]">Item</h2>
                  <div className="mt-2 space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-[#5a4a3a]">
                          {item.productName} × {item.qty}
                          {item.notes ? ` — ${item.notes}` : ""}
                        </span>
                        <span className="font-medium text-[#6b4a2b]">
                          {formatRupiah(item.lineTotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {booking && (
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
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3">
              <a
                href={`/order/status?code=${encodeURIComponent(order?.code ?? booking!.code)}&phone=${encodeURIComponent(order?.customerPhone ?? booking!.phone)}`}
                className="inline-flex items-center justify-center rounded-xl border border-[#A0522D] bg-white px-6 py-3 text-sm font-semibold text-[#6b4a2b] shadow-sm transition hover:border-[#8b4513]"
              >
                Cek Status
              </a>
              <a
                href={`https://wa.me/${order?.customerPhone?.replace(/^0/, "62") ?? booking!.phone.replace(/^0/, "62")}?text=Halo%20Toko%20Mini%20Moni,%20saya%20baru%20memesan%20dengan%20kode%20${encodeURIComponent(order?.code ?? booking!.code)}.`}
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
        <footer className="mt-10 border-t border-[#efe2c7] pt-6 text-center text-xs text-[#5a4a3a]">
          <p>Toko Mini Moni · Jam operasional 09.00 – 17.00 WIB</p>
          <p>Hubungi kami via WhatsApp: 0812-3456-7890</p>
        </footer>
      </div>
    </div>
  );
}
