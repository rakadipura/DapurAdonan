"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
import { formatRupiah } from "@/lib/money";

type OrderStatus = "PENDING" | "CONFIRMED" | "BAKING" | "READY" | "COMPLETED" | "CANCELLED";

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "BAKING", "READY", "COMPLETED", "CANCELLED"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Menunggu konfirmasi",
  CONFIRMED: "Dikonfirmasi",
  BAKING: "Sedang dibakar",
  READY: "Siap diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

interface AdminOrder {
  code: string;
  status: OrderStatus;
  type: string;
  customerName: string;
  customerPhone: string;
  total: number;
  isPaid: boolean;
  paymentMethod: string;
  createdAt: string;
  pickupDate: string | null;
  pickupWindow: string | null;
}

interface OrderStats {
  todayCount: number;
  pendingCount: number;
  unpaidCount: number;
  todayRevenue: number;
}

export function OrdersPanel() {
  const [scope, setScope] = useState<"today" | "all">("today");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
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

    fetch(`/api/admin/orders?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat pesanan");
        if (mountedRef.current) {
          setOrders(data.orders);
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

  const handleStatusChange = (code: string, status: OrderStatus) => {
    setPendingCode(code);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${code}/status`, {
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

  const handleConfirmPayment = (code: string) => {
    setPendingCode(code);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${code}/payment`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mengonfirmasi pembayaran");
        load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal mengonfirmasi pembayaran");
      } finally {
        setPendingCode(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#6b4a2b]">Pesanan</h1>
        <p className="text-sm text-[#5a4a3a]">Kelola status dan pembayaran pesanan pelanggan.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-3">
            <p className="text-xs text-[#5a4a3a]">Hari ini</p>
            <p className="text-lg font-bold text-[#6b4a2b]">{stats.todayCount}</p>
          </div>
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-3">
            <p className="text-xs text-[#5a4a3a]">Menunggu</p>
            <p className="text-lg font-bold text-[#6b4a2b]">{stats.pendingCount}</p>
          </div>
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-3">
            <p className="text-xs text-[#5a4a3a]">Belum dibayar</p>
            <p className="text-lg font-bold text-[#6b4a2b]">{stats.unpaidCount}</p>
          </div>
          <div className="rounded-2xl border border-[#efe2c7] bg-white p-3">
            <p className="text-xs text-[#5a4a3a]">Omzet hari ini</p>
            <p className="text-lg font-bold text-[#6b4a2b]">{formatRupiah(stats.todayRevenue)}</p>
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
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
          className="rounded-lg border border-[#e6c98a] bg-white px-3 py-1.5 text-sm text-[#6b4a2b] focus:border-[#A0522D] focus:outline-none"
        >
          <option value="">Semua status</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-[#5a4a3a]">Memuat…</p>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
          Tidak ada pesanan.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#efe2c7] bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#efe2c7] text-left text-xs text-[#5a4a3a]">
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Pelanggan</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Pembayaran</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.code} className="border-b border-[#f2e9d5] last:border-0 align-top">
                  <td className="px-4 py-3 font-mono font-semibold text-[#A0522D]">{order.code}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#6b4a2b]">{order.customerName}</p>
                    <p className="text-xs text-[#5a4a3a]">{order.customerPhone}</p>
                    {order.pickupDate && (
                      <p className="text-xs text-[#5a4a3a]">
                        {order.pickupDate} {order.pickupWindow ? `· ${order.pickupWindow}` : ""}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5a4a3a]">{order.type === "PICKUP" ? "Pickup" : "Delivery"}</td>
                  <td className="px-4 py-3 font-medium text-[#6b4a2b]">{formatRupiah(order.total)}</td>
                  <td className="px-4 py-3">
                    {order.isPaid ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Sudah dibayar
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Belum dibayar
                        </span>
                        <button
                          onClick={() => handleConfirmPayment(order.code)}
                          disabled={pendingCode === order.code}
                          className="block text-xs font-medium text-[#A0522D] hover:underline disabled:opacity-50"
                        >
                          Konfirmasi pembayaran
                        </button>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-[#5a4a3a]">{order.paymentMethod}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={pendingCode === order.code}
                      onChange={(e) => handleStatusChange(order.code, e.target.value as OrderStatus)}
                      className="rounded-lg border border-[#e6c98a] bg-white px-2 py-1 text-xs text-[#6b4a2b] focus:border-[#A0522D] focus:outline-none disabled:opacity-50"
                    >
                      {ORDER_STATUSES.map((s) => (
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
