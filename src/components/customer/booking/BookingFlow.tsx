"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CustomerType } from "@/types";
import { formatRupiah } from "@/lib/money";
import { isValidPhone, normalizePhone } from "@/lib/regex";
import { fromWIBString } from "@/lib/settings";
import { ChevronLeftIcon, Loader2Icon, PlusIcon, MinusIcon, SkipForwardIcon } from "lucide-react";

interface Slot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

interface SlotAvailability extends Slot {
  remaining: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string | null;
  dailyStock: number | null;
  isAvailable: boolean;
  category: { name: string };
  variants?: Array<{ id: number; name: string; priceDiff: number; isDefault?: boolean }>;
  addOns?: Array<{ id: number; name: string; price: number; isRequired: boolean }>;
}

interface BookingMenuCategoryConfig {
  categoryId: number;
  categoryName: string;
  isVisible: boolean;
  sortOrder: number;
}

interface MenuItem {
  productId: number;
  variantId?: number;
  qty: number;
  notes?: string;
  selectedAddOns?: string[];
}

interface BookingFlowProps {
  categories: Array<{ id: number; name: string; slug: string }>;
  products: Product[];
  slots: Slot[];
  dateOptions: Array<{ date: string; label: string }>;
  leadHours: number;
  defaultDate: string;
  bookingMenuCategories?: BookingMenuCategoryConfig[];
}

type Step = "date" | "details" | "menu" | "confirm";

export function BookingFlow({
  slots,
  dateOptions,
  leadHours,
  defaultDate,
  categories,
  products,
  bookingMenuCategories,
}: BookingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedSlot, setSelectedSlot] = useState<SlotAvailability | null>(null);
  const [partySize, setPartySize] = useState(0);
  const [contact, setContactLocal] = useState<CustomerType>({ name: "", phone: "", email: "" });
  const [availableSlots, setAvailableSlots] = useState<SlotAvailability[]>(() =>
    slots.map((s) => ({
      ...s,
      remaining: s.capacity,
    }))
  );
  const [isSubmitting, startTransition] = useTransition();
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string; phone: string } | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const maxSeats = availableSlots.reduce((max, s) => Math.max(max, s.remaining), 0);
  const effPartySize = partySize;

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    for (const p of products) {
      if (!p.isAvailable) continue;
      const catName = p.category.name;
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(p);
    }
    return grouped;
  }, [products]);

  const categoryOrder = useMemo(() => {
    // If no config provided, fall back to categories prop order
    if (!bookingMenuCategories || bookingMenuCategories.length === 0) {
      return categories.filter((c) => productsByCategory[c.name]?.length).map((c) => c.name);
    }

    // Build a map for quick lookup
    const configMap = new Map(bookingMenuCategories.map((c) => [c.categoryId, c]));
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Filter and sort based on config
    const visibleCategories = bookingMenuCategories
      .filter((config) => config.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((config) => {
        const category = categoryMap.get(config.categoryId);
        return category?.name;
      })
      .filter((name): name is string => name !== undefined && productsByCategory[name]?.length > 0);

    return visibleCategories;
  }, [categories, productsByCategory, bookingMenuCategories]);

  const menuTotal = useMemo(() =>
    menuItems.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return sum;
      const variant = item.variantId ? product.variants?.find((v) => v.id === item.variantId) : null;
      const basePrice = product.price + (variant?.priceDiff ?? 0);
      const addOnsPrice = item.selectedAddOns?.reduce((s, addOnId) => {
        const addOn = product.addOns?.find((a) => a.id === Number(addOnId));
        return s + (addOn?.price ?? 0);
      }, 0) ?? 0;
      return sum + (basePrice + addOnsPrice) * item.qty;
    }, 0),
    [menuItems, products]
  );

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep("details");
    setError(null);
    setSuccess(null);
    setIsLoadingSlots(true);
    try {
      const res = await fetch(`/api/bookings/slots?date=${date}`);
      const data = await res.json();
      if (data.slots) {
        setAvailableSlots(data.slots);
      }
    } catch {
      setAvailableSlots(
        slots.map((s) => ({
          ...s,
          remaining: s.capacity,
        }))
      );
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const goBack = () => {
    if (step === "details") setStep("date");
    else if (step === "menu") setStep("details");
    else if (step === "confirm") setStep("menu");
  };

  const goForward = () => {
    if (step === "date") setStep("details");
    else if (step === "details") setStep("menu");
    else if (step === "menu") setStep("confirm");
  };

  const isDateDisabled = (date: string) => {
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWIB = new Date(now.getTime() + wibOffset);
    const dateStart = fromWIBString(date);
    const diffHours = (dateStart.getTime() - nowWIB.getTime()) / (1000 * 60 * 60);
    return diffHours < leadHours;
  };

  const updateMenuItem = (productId: number, variantId: number | undefined, updates: Partial<MenuItem>) => {
    setMenuItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
      );
      if (idx === -1) {
        if ((updates.qty ?? 0) <= 0) return prev;
        return [...prev, { productId, variantId, qty: updates.qty ?? 1, notes: updates.notes, selectedAddOns: updates.selectedAddOns }];
      }
      const updated = { ...prev[idx], ...updates };
      if ((updated.qty ?? 0) <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
    });
  };

  const incrementQty = (productId: number, variantId: number | undefined) => {
    setMenuItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === productId && i.variantId === variantId);
      if (idx === -1) return [...prev, { productId, variantId, qty: 1 }];
      const updated = [...prev];
      updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
      return updated;
    });
  };

  const decrementQty = (productId: number, variantId: number | undefined) => {
    setMenuItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === productId && i.variantId === variantId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], qty: updated[idx].qty - 1 };
      if (updated[idx].qty <= 0) {
        return updated.filter((_, i) => i !== idx);
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!contact.name.trim()) {
      setError("Nama wajib diisi");
      return;
    }
    if (!isValidPhone(contact.phone)) {
      setError("Nomor telepon tidak valid");
      return;
    }
    if (!selectedSlot) {
      setError("Pilih jadwal dahulu");
      return;
    }
    if (effPartySize === 0) {
      setError("Jumlah orang minimal 1");
      return;
    }
    if (selectedSlot.remaining < effPartySize) {
      setError(`Hanya tersisa ${selectedSlot.remaining} kursi untuk jadwal ini`);
      return;
    }
    if (isDateDisabled(selectedDate)) {
      setError(`Booking minimal ${leadHours} jam sebelum jadwal`);
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const payload = {
          date: selectedDate,
          slotId: selectedSlot.id,
          partySize: effPartySize,
          name: contact.name,
          phone: normalizePhone(contact.phone),
          email: contact.email || undefined,
          menuItems,
        };

        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Gagal membuat booking");
          return;
        }

        setSuccess({ code: data.booking.code, phone: data.booking.phone });
        router.push(data.redirectUrl);
      } catch (err) {
        console.error("Booking error:", err);
        setError("Terjadi kesalahan jaringan. Periksa koneksi dan coba lagi.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-[#efe2c7] bg-white p-6 shadow-md">
      {/* Steps indicator */}
      <div className="mb-6 flex items-center gap-2">
        {(["date", "details", "menu", "confirm"] as Step[]).map((s, i) => {
          const idx = i + 1;
          const active = step === s;
          const done = (["date", "details", "menu"] as Step[]).includes(s) &&
            (["date", "details", "menu"] as Step[]).indexOf(step) >= (["date", "details", "menu"] as Step[]).indexOf(s);
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium border ${
                  active
                    ? "border-[#A0522D] bg-[#A0522D] text-white"
                    : done
                    ? "border-[#A0522D] bg-[#fffaf0] text-[#A0522D]"
                    : "border-[#e6c98a] bg-white text-[#5a4a3a]"
                }`}
              >
                {done ? "✓" : idx}
              </span>
              {i < 3 && <span className="h-0.5 flex-1 bg-[#e6c98a]" />}
            </div>
          );
        })}
      </div>

      {/* Back button */}
      {step !== "date" && (
        <button
          type="button"
          onClick={goBack}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#A0522D] hover:underline"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Kembali
        </button>
      )}

      <div className="space-y-6">
        {/* Step 1: pick date */}
        {step === "date" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#6b4a2b]">Pilih Tanggal</h2>
            <div className="grid grid-cols-2 gap-2">
              {dateOptions.map((opt) => {
                const disabled = isDateDisabled(opt.date);
                return (
                  <button
                    key={opt.date}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDateChange(opt.date)}
                    className={`rounded-xl border p-3 text-left transition ${
                      selectedDate === opt.date
                        ? "border-[#A0522D] bg-[#fffaf0] text-[#6b4a2b] font-medium"
                        : disabled
                        ? "border-[#e6c98a] bg-gray-50 text-[#5a4a3a] opacity-60 cursor-not-allowed"
                        : "border-[#e6c98a] bg-white text-[#5a4a3a] hover:border-[#A0522D]"
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    {disabled && (
                      <div className="text-xs text-amber-600 mt-1">
                        Minimal {leadHours} jam sebelum
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {dateOptions.length === 0 && (
              <p className="mt-2 text-sm text-[#5a4a3a]">Belum ada tanggal tersedia.</p>
            )}
          </div>
        )}

        {/* Step 2: slot + party size */}
        {step === "details" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#6b4a2b]">
              Pilih Jam & Jumlah Orang
            </h2>

            <p className="mb-3 text-sm text-[#5a4a3a]">
              Tanggal: <span className="font-medium text-[#6b4a2b]">{selectedDate}</span>
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Pilih Waktu & Jumlah Orang</label>
              <div className="grid grid-cols-1 gap-2">
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2Icon className="h-6 w-6 animate-spin text-[#A0522D]" />
                    <span className="ml-2 text-sm text-[#5a4a3a]">Memuat ketersediaan…</span>
                  </div>
                ) : (
                  availableSlots.map((slot) => {
                    const disabled = partySize === 0 || partySize > slot.remaining;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setStep("menu");
                        }}
                        className={`rounded-lg border p-3 text-left transition ${
                          selectedSlot?.id === slot.id
                            ? "border-[#A0522D] bg-[#fffaf0] text-[#6b4a2b] font-medium"
                            : disabled
                            ? "border-[#e6c98a] bg-gray-50 text-[#5a4a3a] opacity-60 cursor-not-allowed"
                            : "border-[#e6c98a] bg-white text-[#5a4a3a] hover:border-[#A0522D]"
                        }`}
                      >
                        <>
                          <span>
                            {slot.name} · {slot.startTime} – {slot.endTime}&nbsp;
                          </span>
                          <span className={`text-sm ${disabled ? "text-red-600" : "text-[#A0522D]"}`}>
                            {disabled
                              ? slot.remaining < 1
                                ? "Penuh"
                                : partySize === 0
                                ? "Pilih jumlah orang dulu"
                                : "Jumlah orang melebihi kapasitas"
                              : slot.remaining + " kursi tersedia"}
                          </span>
                        </>
                      </button>
                    );
                  })
                )}
                {availableSlots.length === 0 && !isLoadingSlots && (
                  <p className="mt-2 text-sm text-[#5a4a3a]">Belum ada jadwal tersedia untuk tanggal ini.</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">
                Jumlah orang ({effPartySize})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={effPartySize <= 0}
                  onClick={() => setPartySize(Math.max(0, effPartySize - 1))}
                  className="h-8 w-8 rounded-full border border-[#e6c98a] bg-white flex items-center justify-center text-sm font-medium text-[#6b4a2b] hover:bg-[#fff6e6] disabled:opacity-40"
                  aria-label="Kurangi"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="flex-1 text-center text-lg font-semibold text-[#6b4a2b]">
                  {effPartySize}
                </span>
                <button
                  type="button"
                  disabled={effPartySize >= maxSeats}
                  onClick={() => setPartySize(Math.min(maxSeats, effPartySize + 1))}
                  className="h-8 w-8 rounded-full border border-[#e6c98a] bg-white flex items-center justify-center text-sm font-medium text-[#6b4a2b] hover:bg-[#fff6e6] disabled:opacity-40"
                  aria-label="Tambah"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: menu selection (optional) */}
        {step === "menu" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#6b4a2b]">
              Pilih Menu (Opsional)
            </h2>

            <p className="mb-3 text-sm text-[#5a4a3a]">
              Tanggal: <span className="font-medium text-[#6b4a2b]">{selectedDate}</span>
              {" · "}
              <span className="font-medium text-[#6b4a2b]">{selectedSlot?.name}</span>
              ({selectedSlot?.startTime}–{selectedSlot?.endTime})
              {" · "}
              <span className="font-medium text-[#6b4a2b]">{effPartySize} orang</span>
            </p>

            <div className="mb-4 rounded-lg bg-[#FFF6E6] p-3 text-sm">
              <span className="font-medium text-[#6b4a2b]">Ringkasan Menu:</span>
              {menuItems.length === 0 ? (
                <span className="ml-2 text-[#5a4a3a]">Belum ada menu dipilih (bisa diisi di tempat)</span>
              ) : (
                <span className="ml-2 text-[#5a4a3a]">
                  {menuItems.length} item · {formatRupiah(menuTotal)}
                </span>
              )}
            </div>

            {categoryOrder.length === 0 ? (
              <p className="text-sm text-[#5a4a3a] text-center py-8">Belum ada produk tersedia.</p>
            ) : (
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {categoryOrder.map((catName) => {
                  const catProducts = productsByCategory[catName];
                  if (!catProducts?.length) return null;
                  return (
                    <div key={catName}>
                      <h3 className="mb-2 text-sm font-semibold text-[#6b4a2b] uppercase tracking-wide">
                        {catName}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {catProducts.map((product) => {
                          const variants = product.variants ?? [];
                          const addOns = product.addOns ?? [];

                          const getItemQty = (varId?: number) =>
                            menuItems.find(
                              (i) => i.productId === product.id && i.variantId === varId
                            )?.qty ?? 0;

                          const renderVariant = (variant: { id: number; name: string; priceDiff: number; isDefault?: boolean }) => {
                            const qty = getItemQty(variant.id);
                            const price = product.price + variant.priceDiff;
                            return (
                              <div key={variant.id} className="rounded-lg border border-[#e6c98a] bg-white p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-[#6b4a2b] truncate">
                                      {product.name} — {variant.name}
                                    </div>
                                    <div className="text-xs text-[#5a4a3a] mt-0.5">
                                      {formatRupiah(price)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {qty > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => decrementQty(product.id, variant.id)}
                                        className="h-8 w-8 rounded-full border border-[#e6c98a] bg-white flex items-center justify-center text-sm font-medium text-[#6b4a2b] hover:bg-[#fff6e6]"
                                        aria-label="Kurangi"
                                      >
                                        <MinusIcon className="h-4 w-4" />
                                      </button>
                                    )}
                                    <span className={`text-center ${qty > 0 ? "font-semibold text-[#A0522D]" : "text-[#5a4a3a]"} w-8`}>
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => incrementQty(product.id, variant.id)}
                                      className="h-8 w-8 rounded-full border border-[#e6c98a] bg-white flex items-center justify-center text-sm font-medium text-[#6b4a2b] hover:bg-[#fff6e6]"
                                      aria-label="Tambah"
                                    >
                                      <PlusIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                {addOns.length > 0 && qty > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {addOns.map((addOn) => {
                                      const isSelected = menuItems.find(
                                        (i) => i.productId === product.id && i.variantId === variant.id
                                      )?.selectedAddOns?.includes(String(addOn.id));
                                      return (
                                        <label key={addOn.id} className="flex items-center gap-2 text-xs text-[#5a4a3a] cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isSelected ?? false}
                                            onChange={() =>
                                              updateMenuItem(product.id, variant.id, {
                                                selectedAddOns: isSelected
                                                  ? (menuItems.find(
                                                      (i) => i.productId === product.id && i.variantId === variant.id
                                                    )?.selectedAddOns ?? []).filter((id) => id !== String(addOn.id))
                                                  : [...(menuItems.find(
                                                      (i) => i.productId === product.id && i.variantId === variant.id
                                                    )?.selectedAddOns ?? []), String(addOn.id)],
                                              })
                                            }
                                            className="h-4 w-4 rounded border-[#e6c98a] text-[#A0522D] focus:ring-[#A0522D]"
                                          />
                                          <span>{addOn.name}</span>
                                          {addOn.price > 0 && (
                                            <span className="ml-auto text-[#A0522D]">{formatRupiah(addOn.price)}</span>
                                          )}
                                          {addOn.isRequired && (
                                            <span className="text-amber-600 text-xs">(wajib)</span>
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          };

                          if (variants.length > 1) {
                            return (
                              <div key={product.id} className="space-y-2">
                                {variants.map(renderVariant)}
                              </div>
                            );
                          } else {
                            return renderVariant(variants[0] ?? { id: 0, name: "", priceDiff: 0 });
                          }
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={goForward}
                className="flex-1 rounded-lg border border-[#A0522D] bg-white px-4 py-2 text-sm font-medium text-[#A0522D] transition hover:bg-[#fffaf0]"
              >
                <SkipForwardIcon className="h-4 w-4 mr-1" />
                Lewati
              </button>
              <button
                type="button"
                onClick={goForward}
                className="flex-1 rounded-lg border-0 bg-[#A0522D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8b4513]"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        )}

        {/* Step 4: contact + confirm */}
        {step === "confirm" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#6b4a2b]">
              Masukkan Info Kontak & Konfirmasi
            </h2>

            <div className="mb-4 rounded-lg bg-[#FFF6E6] p-3 text-sm">
              <span className="font-medium text-[#6b4a2b]">Ringkasan:</span>
              <span className="ml-2 text-[#5a4a3a]">
                {selectedDate} · {selectedSlot?.name} (
                {selectedSlot?.startTime}–{selectedSlot?.endTime}) · {effPartySize} orang
              </span>
              {menuItems.length > 0 && (
                <span className="ml-2 text-[#A0522D]">· {menuItems.length} menu · {formatRupiah(menuTotal)}</span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Nama lengkap</label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => setContactLocal({ ...contact, name: e.target.value })}
                  placeholder="Nama Anda"
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Nomor telepon</label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContactLocal({ ...contact, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Email (opsional)</label>
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContactLocal({ ...contact, email: e.target.value })}
                  placeholder="email@contoh.com"
                  className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D] focus:ring-1 focus:ring-[#A0522D]"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || contact.name === "" || contact.phone === ""}
              className="mt-4 w-full rounded-lg border-0 bg-[#A0522D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8b4513] disabled:cursor-not-allowed disabled:bg-[#d9b38c]"
            >
              {isSubmitting ? "Memproses…" : "Konfirmasi Booking"}
            </button>
          </div>
        )}

        {/* Success state */}
        {success && (
          <div className="rounded-2xl border border-[#e6c98a] bg-[#FFF6E6] p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#A0522D] text-white text-2xl">
              ✅
            </div>
            <h2 className="text-xl font-bold text-[#6b4a2b]">Booking Berhasil!</h2>
            <p className="mt-1 text-sm text-[#5a4a3a]">
              Terima kasih. Kami akan menghubungi Anda untuk konfirmasi.
            </p>
            <div className="mt-4 rounded-lg bg-white p-3 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-[#5a4a3a]">Kode booking</span>
                <span className="font-mono font-bold text-[#A0522D]">{success.code}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[#5a4a3a]">Nomor telepon</span>
                <span className="font-medium text-[#6b4a2b]">{success.phone}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[#5a4a3a]">Tanggal</span>
                <span className="font-medium text-[#6b4a2b]">{selectedDate}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[#5a4a3a]">Waktu</span>
                <span className="font-medium text-[#6b4a2b]">
                  {selectedSlot?.startTime} – {selectedSlot?.endTime}
                </span>
              </div>
              {menuItems.length > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-[#5a4a3a]">Menu dipesan</span>
                  <span className="font-medium text-[#6b4a2b]">{menuItems.length} item</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <a
                href={`/booking/status?code=${success.code}&phone=${encodeURIComponent(success.phone)}`}
                className="rounded-lg border border-[#A0522D] px-4 py-2 text-sm font-medium text-[#6b4a2b] transition hover:bg-[#fffaf0]"
              >
                Cek status
              </a>
              <a
                href={`https://wa.me/${success.phone.replace(/^0/, "62")}?text=Halo%20Toko%20Mini%20Moni,%20saya%20baru%20membooking%20meja%20dengan%20kode%20${encodeURIComponent(success.code)}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[#A0522D] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8b4513]"
              >
                Konfirmasi via WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}