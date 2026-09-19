"use client";

import { useState, useTransition, useCallback } from "react";
import { useSession } from "@/components/customer/SessionProvider";
import type { Product, CustomerType, PickupWindow, DeliveryZone } from "@/types";
import { formatRupiah } from "@/lib/money";

interface OrderFormProps {
  products: Product[];
  categories: Array<{ id: number; name: string; slug: string }>;
  settings: {
    pickupWindows: PickupWindow[];
    deliveryZones: DeliveryZone[];
    maxPartySize: number;
    transferInfo: string | null;
    waNumber: string;
  };
  featuredOrders?: Array<{ code: string; customerName: string; total: number; status: string }>;
}

function getCartKey(item: {
  productId: number;
  variantId?: number;
  selectedAddOns?: string[];
}): string {
  const variantKey = item.variantId ?? "none";
  const addOnsKey = item.selectedAddOns?.sort().join(",") ?? "";
  return `${item.productId}-${variantKey}-${addOnsKey}`;
}

export function OrderForm({
  products,
  settings,
  featuredOrders = [],
}: OrderFormProps) {
  const { state, updateCartQty, removeFromCart, clearCart, totalAmount, itemCount } = useSession();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [isSubmitting, startTransition] = useTransition();
  const [orderError, setOrderError] = useState<string | null>(null);

  const [contact, setContactLocal] = useState<CustomerType>({ name: "", phone: "", email: "" });
  const [orderType, setOrderType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupWindow, setPickupWindow] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryZone, setDeliveryZone] = useState(settings.deliveryZones[0]?.zone ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"TRANSFER" | "EWALLET" | "CASH" | "QRIS">("CASH");
  const [notes, setNotes] = useState("");

  const availableWindows = settings.pickupWindows;

  const hasCustomCake = state.cart.some((item) => {
    const product = products.find((p) => p.id === item.productId);
    return product?.isCustomCake;
  });

  const handlePlaceOrder = useCallback(() => {
    setOrderError(null);
    startTransition(async () => {
      try {
        const payload = {
          items: state.cart.map((c) => ({
            productId: c.productId,
            variantId: c.variantId,
            qty: c.qty,
            notes: c.notes,
            selectedAddOns: c.selectedAddOns,
          })),
          type: orderType,
          customerName: contact.name,
          customerPhone: contact.phone,
          customerEmail: contact.email || undefined,
          pickupDate: orderType === "PICKUP" ? pickupDate : undefined,
          pickupWindow: orderType === "PICKUP" ? pickupWindow : undefined,
          deliveryAddress: orderType === "DELIVERY" ? deliveryAddress : undefined,
          deliveryZone: orderType === "DELIVERY" ? deliveryZone : undefined,
          paymentMethod,
          notes: notes || undefined,
          isCustomCake: hasCustomCake,
          customText: hasCustomCake ? state.cart.find((c) => {
            const p = products.find((pp) => pp.id === c.productId);
            return p?.isCustomCake;
          })?.notes : undefined,
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setOrderError(data.error ?? "Gagal memproses pesanan");
          return;
        }

        clearCart();
        setStep("cart");

        window.location.href = data.redirectUrl as string;
      } catch (err) {
        setOrderError("Terjadi kesalahan. Coba lagi.");
      }
    });
  }, [state.cart, contact, orderType, pickupDate, pickupWindow, deliveryAddress, deliveryZone, paymentMethod, notes, clearCart, products, hasCustomCake]);

  return (
    <div className="rounded-2xl border border-[#efe2c7] bg-white p-6 shadow-md">
      {/* Order summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between border-b border-[#efe2c7] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#6b4a2b]">Ringkasan Pesanan</h2>
            <p className="text-sm text-[#5a4a3a]">
              {state.cart.length === 0
                ? "Keranjang masih kosong"
                : `${itemCount} item · ${formatRupiah(totalAmount)}`}
            </p>
          </div>
          {state.cart.length > 0 && (
            <button
              type="button"
              onClick={() => setStep(step === "cart" ? "checkout" : "cart")}
              className="rounded-lg border border-[#A0522D] bg-white px-4 py-2 text-sm font-medium text-[#6b4a2b] transition hover:bg-[#fffaf0]"
            >
              {step === "cart" ? "Lanjutkan ke Pembayaran" : "Kembali ke Keranjang"}
            </button>
          )}
        </div>

        {step === "cart" && state.cart.length > 0 && (
          <div className="mt-4 space-y-2">
            {state.cart.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const variant = product?.variants?.find((v) => v.id === item.variantId);
              const cartKey = getCartKey(item);
              return (
                <div key={cartKey} className="flex items-center justify-between rounded-lg bg-[#fffaf0] px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="text-[#6b4a2b] font-medium">{item.name}</span>
                      {variant && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[#FCE9C8] text-[#A0522D]">{variant.name}</span>
                      )}
                      {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[#e6c98a] text-[#A0522D]">
                          +{item.selectedAddOns.length} tambahan
                        </span>
                      )}
                      {item.notes && (
                        <div className="text-xs text-[#5a4a3a] truncate">{item.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQty(cartKey, item.qty - 1)}
                      className="h-6 w-6 rounded border border-[#e6c98a] text-center text-xs font-medium text-[#6b4a2b] hover:bg-[#fff6e6]"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-[#6b4a2b] font-medium">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(cartKey, item.qty + 1)}
                      className="h-6 w-6 rounded border border-[#e6c98a] text-center text-xs font-medium text-[#6b4a2b] hover:bg-[#fff6e6]"
                    >
                      +
                    </button>
                    <span className="ml-1 text-[#A0522D] font-medium">
                      {formatRupiah((item.price + (item.addOnsPrice || 0)) * item.qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(cartKey)}
                      className="ml-1 text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-end pt-2 text-right">
              <span className="text-base font-bold text-[#6b4a2b]">
                Total: {formatRupiah(totalAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Checkout form */}
      {step === "checkout" && (
        <div className="space-y-5">
          {/* Contact */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-[#6b4a2b]">Info Kontak</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Nama lengkap</label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => setContactLocal({ ...contact, name: e.target.value })}
                  placeholder="Nama Anda"
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Nomor telepon / WhatsApp</label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContactLocal({ ...contact, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Email (opsional)</label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContactLocal({ ...contact, email: e.target.value })}
                  placeholder="email@contoh.com"
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
            </div>
          </div>

          {/* Order type */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-[#6b4a2b]">Jenis Pengambilan</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType("PICKUP")}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  orderType === "PICKUP"
                    ? "border-[#A0522D] bg-[#fffaf0] text-[#6b4a2b] font-medium"
                    : "border-[#e6c98a] bg-white text-[#5a4a3a]"
                }`}
              >
                Pickup (Ambil sendiri)
              </button>
              <button
                type="button"
                onClick={() => setOrderType("DELIVERY")}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  orderType === "DELIVERY"
                    ? "border-[#A0522D] bg-[#fffaf0] text-[#6b4a2b] font-medium"
                    : "border-[#e6c98a] bg-white text-[#5a4a3a]"
                }`}
              >
                Delivery (Antar)
              </button>
            </div>
          </div>

          {/* Pickup details */}
          {orderType === "PICKUP" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Tanggal pengambilan</label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Jam pengambilan</label>
                <select
                  value={pickupWindow}
                  onChange={(e) => setPickupWindow(e.target.value)}
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                >
                  <option value="">Pilih jadwal</option>
                  {availableWindows.map((w) => (
                    <option key={w.start} value={`${w.start}-${w.end}`}>
                      {w.start} – {w.end}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Delivery details */}
          {orderType === "DELIVERY" && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Alamat pengiriman</label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  placeholder="Alamat lengkap, termasuk kelurahan/kecamatan"
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Zona pengiriman</label>
                <select
                  value={deliveryZone}
                  onChange={(e) => setDeliveryZone(e.target.value)}
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                >
                  <option value="">Pilih zona</option>
                  {settings.deliveryZones.map((z) => (
                    <option key={z.zone} value={z.zone}>
                      {z.zone} (Rp{z.baseFee.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Payment */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-[#6b4a2b]">Metode Pembayaran</h3>
            <div className="grid grid-cols-4 gap-2">
              {(["CASH", "TRANSFER", "QRIS", "EWALLET"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-lg border px-2 py-2 text-sm transition capitalize ${
                    paymentMethod === method
                      ? "border-[#A0522D] bg-[#fffaf0] text-[#6b4a2b] font-medium"
                      : "border-[#e6c98a] bg-white text-[#5a4a3a]"
                  }`}
                >
                  {method === "CASH" ? "Tunai" : method === "TRANSFER" ? "Transfer" : method === "QRIS" ? "QRIS" : "E-Wallet"}
                </button>
              ))}
            </div>
            {paymentMethod === "TRANSFER" && settings.transferInfo && (
              <div className="mt-2 rounded-lg bg-[#FFF6E6] p-3 text-xs text-[#5a4a3a]" dangerouslySetInnerHTML={{ __html: settings.transferInfo }} />
            )}
            {paymentMethod === "QRIS" && (
              <div className="mt-2 rounded-lg bg-[#FFF6E6] p-3 text-xs text-[#5a4a3a]">
                QRIS akan ditampilkan setelah pesanan dikonfirmasi. Silakan scan menggunakan aplikasi e-wallet/banking Anda.
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-[#5a4a3a]">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contoh: tidak pakai kopi, tambah gula, dll."
              className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
            />
          </div>

          {orderError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {orderError}
            </div>
          )}

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={
              isSubmitting ||
              contact.name === "" ||
              contact.phone === "" ||
              (orderType === "PICKUP" && (!pickupDate || !pickupWindow)) ||
              (orderType === "DELIVERY" && (!deliveryAddress || !deliveryZone))
            }
            className="w-full rounded-lg border-0 bg-[#A0522D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8b4513] disabled:cursor-not-allowed disabled:bg-[#d9b38c]"
          >
            {isSubmitting ? "Memproses…" : `Pesan Sekarang · ${formatRupiah(totalAmount)}`}
          </button>
        </div>
      )}

      {step === "cart" && state.cart.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#e6c98a] bg-[#FFF6E6] p-6 text-center text-sm text-[#5a4a3a]">
          <p className="mb-2">Keranjang masih kosong.</p>
          <p>Tambahkan produk dari menu di atas, lalu klik "Tambah ke Keranjang".</p>
        </div>
      )}

      {/* Featured recent orders (decorative) */}
      {featuredOrders.length > 0 && (
        <div className="mt-6 rounded-lg border border-[#efe2c7] bg-[#FFF6E6] p-3 text-xs text-[#5a4a3a]">
          <p className="font-medium text-[#6b4a2b]">Pesanan hari ini:</p>
          <ul className="mt-1 space-y-0.5">
            {featuredOrders.map((o) => (
              <li key={o.code} className="flex justify-between">
                <span>#{o.code} — {o.customerName}</span>
                <span className="text-[#A0522D] font-medium">{formatRupiah(o.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}