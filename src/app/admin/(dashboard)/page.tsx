import Link from "next/link";
import { getOrders, getOrderStats } from "@/lib/orders";
import { getTodayBookings, getBookingStats } from "@/lib/bookings";
import { formatRupiah } from "@/lib/money";

export const dynamic = "force-dynamic";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu konfirmasi",
  CONFIRMED: "Dikonfirmasi",
  BAKING: "Sedang dibakar",
  READY: "Siap diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  CANCELLED: "Dibatalkan",
  RESCHEDULED: "Dijadwalkan ulang",
  NO_SHOW: "Tidak hadir",
  COMPLETED: "Selesai",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#efe2c7] bg-white p-4">
      <p className="text-xs font-medium text-[#5a4a3a]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#6b4a2b]">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [orderStats, bookingStats, recentOrders, todayBookings] = await Promise.all([
    getOrderStats(),
    getBookingStats(),
    getOrders({ scope: "today" }),
    getTodayBookings(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-[#6b4a2b]">Dashboard</h1>
        <p className="text-sm text-[#5a4a3a]">Ringkasan hari ini.</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[#6b4a2b]">Pesanan</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Pesanan hari ini" value={orderStats.todayCount} />
          <StatCard label="Menunggu konfirmasi" value={orderStats.pendingCount} />
          <StatCard label="Belum dibayar" value={orderStats.unpaidCount} />
          <StatCard label="Omzet hari ini" value={formatRupiah(orderStats.todayRevenue)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[#6b4a2b]">Booking Meja</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Booking hari ini" value={bookingStats.todayBookings} />
          <StatCard label="Menunggu konfirmasi" value={bookingStats.pendingBookings} />
          <StatCard label="Total booking" value={bookingStats.totalBookings} />
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#6b4a2b]">Pesanan hari ini</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-[#A0522D] hover:underline">
            Lihat semua →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-6 text-center text-sm text-[#5a4a3a]">
            Belum ada pesanan hari ini.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#efe2c7] bg-white">
            <table className="w-full text-sm">
              <tbody>
                {recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.code} className="border-b border-[#f2e9d5] last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold text-[#A0522D]">{order.code}</td>
                    <td className="px-4 py-3 text-[#6b4a2b]">{order.customerName}</td>
                    <td className="px-4 py-3 text-[#5a4a3a]">{ORDER_STATUS_LABELS[order.status] ?? order.status}</td>
                    <td className="px-4 py-3 text-right font-medium text-[#6b4a2b]">{formatRupiah(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#6b4a2b]">Booking hari ini</h2>
          <Link href="/admin/bookings" className="text-sm font-medium text-[#A0522D] hover:underline">
            Lihat semua →
          </Link>
        </div>
        {todayBookings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-6 text-center text-sm text-[#5a4a3a]">
            Belum ada booking hari ini.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#efe2c7] bg-white">
            <table className="w-full text-sm">
              <tbody>
                {todayBookings.slice(0, 5).map((booking) => (
                  <tr key={booking.code} className="border-b border-[#f2e9d5] last:border-0">
                    <td className="px-4 py-3 font-mono font-semibold text-[#A0522D]">{booking.code}</td>
                    <td className="px-4 py-3 text-[#6b4a2b]">{booking.name}</td>
                    <td className="px-4 py-3 text-[#5a4a3a]">
                      {booking.slot.startTime}–{booking.slot.endTime} · {booking.partySize} orang
                    </td>
                    <td className="px-4 py-3 text-right text-[#5a4a3a]">
                      {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
