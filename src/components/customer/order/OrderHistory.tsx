"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/money";
import { isValidPhone } from "@/lib/regex";
import { toast } from "@/components/ui/toast";
import { SearchIcon, PackageIcon, CalendarIcon, ClockIcon, MapPinIcon, CreditCardIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface OrderItem {
  productName: string;
  qty: number;
  price: number;
  variantName?: string;
  addOns?: string[];
}

interface Order {
  code: string;
  status: string;
  type: "PICKUP" | "DELIVERY";
  customerName: string;
  customerPhone: string;
  total: number;
  isPaid: boolean;
  paymentMethod: string;
  createdAt: string;
  pickupDate?: string;
  pickupWindow?: string;
  deliveryAddress?: string;
  deliveryZone?: string;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu konfirmasi",
  CONFIRMED: "Dikonfirmasi",
  BAKING: "Sedang dibakar",
  READY: "Siap diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  BAKING: "bg-orange-100 text-orange-700",
  READY: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function OrderHistory({ showHeader = true }: { showHeader?: boolean } = {}) {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = async (searchPhone: string) => {
    if (!isValidPhone(searchPhone)) {
      setError("Format nomor telepon tidak valid");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const normalizedPhone = searchPhone.startsWith("0") ? "62" + searchPhone.slice(1) : searchPhone;
      const res = await fetch(`/api/orders?phone=${encodeURIComponent(normalizedPhone)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat riwayat pesanan");
      }
      
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat pesanan");
      toast.add({ title: "Gagal memuat riwayat", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(phone);
  };

  const toggleExpand = (code: string) => {
    setExpandedOrder(expandedOrder === code ? null : code);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const inner = (
    <>
      {showHeader && (
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
            ← Kembali ke Toko Mini Moni
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-[#6b4a2b]">Riwayat Pesanan</h1>
          <p className="mt-2 text-base text-[#5a4a3a]">
            Masukkan nomor telepon untuk melihat riwayat pesanan Anda.
          </p>
        </header>
      )}

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-[#efe2c7] bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Nomor Telepon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || phone.trim() === ""}
              className="self-end rounded-lg border-0 bg-[#A0522D] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8b4513] disabled:cursor-not-allowed disabled:bg-[#d9b38c]"
            >
              {isLoading ? "Mencari…" : "Cari Pesanan"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {!isLoading && phone && orders.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
            <PackageIcon className="mx-auto mb-2 h-12 w-12 text-[#5a4a3a]" />
            <p>Tidak ada pesanan ditemukan untuk nomor ini.</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.code}
                className="rounded-2xl border border-[#efe2c7] bg-white overflow-hidden"
              >
                {/* Order Header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(order.code)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-[#fffaf0] transition"
                >
                  <div className="flex items-center gap-3">
                    <PackageIcon className="h-10 w-10 rounded-lg bg-[#fffaf0] flex items-center justify-center text-[#A0522D]" />
                    <div>
                      <p className="font-medium text-[#6b4a2b]">{order.code}</p>
                      <p className="text-xs text-[#5a4a3a]">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="font-semibold text-[#6b4a2b]">{formatRupiah(order.total)}</p>
                      <p className="text-xs text-[#5a4a3a]">{order.type === "PICKUP" ? "Pickup" : "Delivery"}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="text-[#5a4a3a]">
                      {expandedOrder === order.code ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedOrder === order.code && (
                  <div className="border-t border-[#efe2c7] bg-[#fffaf0] p-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-[#5a4a3a]">Nama</p>
                        <p className="font-medium text-[#6b4a2b]">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5a4a3a]">Telepon</p>
                        <p className="font-medium text-[#6b4a2b]">{order.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5a4a3a]">Pembayaran</p>
                        <p className="font-medium text-[#6b4a2b] flex items-center gap-1">
                          <CreditCardIcon className="h-4 w-4" /> {order.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#5a4a3a]">Status Bayar</p>
                        <p className="font-medium text-[#6b4a2b] flex items-center gap-1">
                          {order.isPaid ? (
                            <>
                              <span className="text-green-600">✓</span> Sudah dibayar
                            </>
                          ) : (
                            <>
                              <span className="text-amber-600">⏳</span> Belum dibayar
                            </>
                          )}
                        </p>
                      </div>
                      {order.pickupDate && (
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4 text-[#5a4a3a]" />
                          <span className="text-xs text-[#5a4a3a]">Tanggal Ambil: </span>
                          <span className="font-medium text-[#6b4a2b]">{order.pickupDate}</span>
                        </div>
                      )}
                      {order.pickupWindow && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4 text-[#5a4a3a]" />
                          <span className="text-xs text-[#5a4a3a]">Jam: </span>
                          <span className="font-medium text-[#6b4a2b]">{order.pickupWindow}</span>
                        </div>
                      )}
                      {order.deliveryAddress && (
                        <div className="sm:col-span-2 flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4 text-[#5a4a3a]" />
                          <span className="text-xs text-[#5a4a3a]">Alamat: </span>
                          <span className="font-medium text-[#6b4a2b]">{order.deliveryAddress}</span>
                        </div>
                      )}
                      {order.deliveryZone && (
                        <div>
                          <p className="text-xs text-[#5a4a3a]">Zona</p>
                          <p className="font-medium text-[#6b4a2b]">{order.deliveryZone}</p>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="border-t border-[#efe2c7] pt-4">
                      <p className="text-sm font-medium text-[#6b4a2b] mb-2">Detail Pesanan</p>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-[#efe2c7] last:border-0">
                            <div className="flex-1">
                              <p className="font-medium text-[#6b4a2b]">{item.productName}</p>
                              {item.variantName && (
                                <p className="text-xs text-[#5a4a3a]">{item.variantName}</p>
                              )}
                              {item.addOns && item.addOns.length > 0 && (
                                <p className="text-xs text-[#5a4a3a]">+ {item.addOns.join(", ")}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-[#6b4a2b]">{formatRupiah(item.price * item.qty)}</p>
                              <p className="text-xs text-[#5a4a3a]">x{item.qty} @ {formatRupiah(item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between font-semibold text-[#6b4a2b]">
                        <span>Total</span>
                        <span>{formatRupiah(order.total)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link
                        href={`/order/status?code=${order.code}&phone=${encodeURIComponent(order.customerPhone)}`}
                        className="rounded-lg border border-[#A0522D] bg-white px-4 py-2 text-sm font-medium text-[#6b4a2b] transition hover:bg-[#fffaf0]"
                      >
                        Cek Status Detail
                      </Link>
                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/^0/, "62")}?text=Halo%20Toko%20Mini%20Moni,%20saya%20ingin%20bertanya%20tentang%20pesanan%20${encodeURIComponent(order.code)}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-[#A0522D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8b4513]"
                      >
                        Hubungi via WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showHeader && (
          <footer className="mt-10 border-t border-[#efe2c7] pt-6 text-center text-xs text-[#5a4a3a]">
            <p>Toko Mini Moni · Jam operasional 09.00 – 17.00 WIB</p>
            <p>Hubungi kami via WhatsApp: 0812-3456-7890</p>
          </footer>
        )}
    </>
  );

  if (!showHeader) {
    return <div className="mx-auto max-w-3xl">{inner}</div>;
  }

  return (
    <div className="min-h-screen bg-[#fffaf0] px-4 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">{inner}</div>
    </div>
  );
}