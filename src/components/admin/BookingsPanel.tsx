"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW" | "COMPLETED";

const BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "RESCHEDULED",
  "NO_SHOW",
  "COMPLETED",
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  CANCELLED: "Dibatalkan",
  RESCHEDULED: "Dijadwalkan ulang",
  NO_SHOW: "Tidak hadir",
  COMPLETED: "Selesai",
};

interface AdminBooking {
  code: string;
  status: BookingStatus;
  date: string;
  slot: { name: string; startTime: string; endTime: string };
  partySize: number;
  name: string;
  phone: string;
}

interface BookingStats {
  todayBookings: number;
  pendingBookings: number;
  totalBookings: number;
}

export function BookingsPanel() {
  const [scope, setScope] = useState<"today" | "all">("today");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const mountedRef = useRef(true);

  const load = useCallback(() => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ scope });
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/bookings?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat booking");
        if (mountedRef.current) {
          setBookings(data.bookings);
          setStats(data.stats);
        }
      })
      .catch((err) => {
        if (mountedRef.current) setError(err.message);
      })
      .finally(() => {
        if (mountedRef.current) setIsLoading(false);
      });
  }, [scope, statusFilter]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = (code: string, status: BookingStatus) => {
    setPendingCode(code);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/bookings/${code}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui status");
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memperbarui status");
      } finally {
        setPendingCode(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#6b4a2b]">Booking Meja</h1>
        <p className="text-sm text-[#5a4a3a]">Kelola status booking meja pelanggan.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-3">
            <p className="text-xs text-[#5a4a3a]">Hari ini</p>
            <p className="text-lg font-bold text-[#6b4a2b]">{stats.todayBookings}</p>
          </div>
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-3">
            <p className="text-xs text-[#5a4a3a]">Menunggu</p>
            <p className="text-lg font-bold text-[#6b4a2b]">{stats.pendingBookings}</p>
          </div>
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-3">
            <p className="text-xs text-[#5a4a3a]">Total</p>
            <p className="text-lg font-bold text-[#6b4a2b]">{stats.totalBookings}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-[#e6c98a] bg-white p-0.5 text-sm">
          {(["today", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                scope === s ? "bg-[#A0522D] text-white" : "text-[#6b4a2b] hover:bg-[#fffaf0]"
              }`}
            >
              {s === "today" ? "Hari ini" : "Semua"}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "")}
          className="rounded-lg border border-[#e6c98a] bg-white px-3 py-1.5 text-sm text-[#6b4a2b] focus:border-[#A0522D] focus:outline-none"
        >
          <option value="">Semua status</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-[#5a4a3a]">Memuat…</p>
      ) : bookings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
          Tidak ada booking.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#efe2c7] bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[#efe2c7] text-left text-xs text-[#5a4a3a]">
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Tanggal &amp; Jadwal</th>
                <th className="px-4 py-3 font-medium">Jumlah orang</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.code} className="border-b border-[#f2e9d5] last:border-0 align-top">
                  <td className="px-4 py-3 font-mono font-semibold text-[#A0522D]">{booking.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#6b4a2b]">{booking.name}</p>
                    <p className="text-xs text-[#5a4a3a]">{booking.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-[#5a4a3a]">
                    {booking.date} · {booking.slot.startTime}–{booking.slot.endTime}
                  </td>
                  <td className="px-4 py-3 text-[#6b4a2b]">{booking.partySize}</td>
                  <td className="px-4 py-3">
                    <select
                      value={booking.status}
                      disabled={pendingCode === booking.code}
                      onChange={(e) => handleStatusChange(booking.code, e.target.value as BookingStatus)}
                      className="rounded-lg border border-[#e6c98a] bg-white px-2 py-1 text-xs text-[#6b4a2b] focus:border-[#A0522D] focus:outline-none disabled:opacity-50"
                    >
                      {BOOKING_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
