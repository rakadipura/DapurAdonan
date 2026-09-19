"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CustomerType } from "@/types";
import { formatRupiah } from "@/lib/money";
import { isValidPhone } from "@/lib/regex";

interface Slot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

interface BookingFlowProps {
  categories: Array<{ id: number; name: string; slug: string }>;
  products: Array<{
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    imageUrl: string | null;
    dailyStock: number | null;
    isAvailable: boolean;
    category: { name: string };
  }>;
  slots: Slot[];
  dateOptions: Array<{ date: string; label: string }>;
  maxPartySize: number;
  leadHours: number;
  defaultDate: string;
}

export function BookingFlow({
  slots,
  dateOptions,
  maxPartySize,
  defaultDate,
}: BookingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<"date" | "details" | "confirm">("date");
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [contact, setContactLocal] = useState<CustomerType>({ name: "", phone: "", email: "" });
  const [availableSlots, setAvailableSlots] = useState<Slot[]>(slots);
  const [isSubmitting, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ code: string; phone: string } | null>(null);

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep("details");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/bookings/slots?date=${date}`);
      const data = await res.json();
      if (data.slots) {
        setAvailableSlots(data.slots);
      }
    } catch {
      setAvailableSlots(slots);
    }
  };

  const handleSubmit = () => {
    if (!isValidPhone(contact.phone)) {
      setError("Nomor telepon tidak valid");
      return;
    }
    if (!selectedSlot) {
      setError("Pilih jadwal dahulu");
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const payload = {
          date: selectedDate,
          slotId: selectedSlot.id,
          partySize,
          name: contact.name,
          phone: contact.phone,
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
        setStep("confirm");
        window.location.href = data.redirectUrl;
      } catch (err) {
        setError("Terjadi kesalahan. Coba lagi.");
      }
    });
  };

  const selectedSlotCapacity = selectedSlot?.capacity ?? 0;
  const slotFull = selectedSlot && selectedSlot.capacity === 0;

  return (
    <div className="rounded-2xl border border-[#efe2c7] bg-white p-6 shadow-md">
      {/* Steps indicator */}
      <div className="mb-6 flex items-center gap-2">
        {(["date", "details", "confirm"] as const).map((s, i) => {
          const idx = i + 1;
          const active = step === s;
          const done = ["date", "details"].includes(s) && ["date", "details"].indexOf(step) >= ["date", "details"].indexOf(s);
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
              {i < 2 && <span className="h-0.5 flex-1 bg-[#e6c98a]" />}
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {/* Step 1: pick date */}
        {step === "date" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#6b4a2b]">Pilih Tanggal</h2>
            <div className="grid grid-cols-2 gap-2">
              {dateOptions.map((opt) => (
                <button
                  key={opt.date}
                  type="button"
                  onClick={() => handleDateChange(opt.date)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selectedDate === opt.date
                      ? "border-[#A0522D] bg-[#fffaf0] text-[#6b4a2b] font-medium"
                      : "border-[#e6c98a] bg-white text-[#5a4a3a]"
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                </button>
              ))}
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
              Pilih Waktu & Jumlah Orang
            </h2>

            <p className="mb-3 text-sm text-[#5a4a3a]">
              Tanggal: <span className="font-medium text-[#6b4a2b]">{selectedDate}</span>
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Waktu</label>
              <div className="grid grid-cols-1 gap-2">
                {slots.map((slot) => {
                  const disabled = slot.capacity === 0;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep("confirm");
                      }}
                      className={`rounded-lg border p-3 text-left transition ${
                        selectedSlot?.id === slot.id
                          ? "border-[#A0522D] bg-[#fffaf0] text-[#6b4a2b] font-medium"
                          : disabled
                          ? "border-[#e6c98a] bg-gray-50 text-[#5a4a3a] opacity-60"
                          : "border-[#e6c98a] bg-white text-[#5a4a3a] hover:border-[#A0522D]"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>
                          {slot.name} · {slot.startTime} – {slot.endTime}
                        </span>
                        <span className={`text-sm ${disabled ? "text-red-600" : "text-[#A0522D]"}`}>
                          {disabled ? "Penuh" : `${slot.capacity} meja tersedia`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {slots.length === 0 && (
                <p className="mt-2 text-sm text-[#5a4a3a]">Belum ada jadwal tersedia.</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">
                Jumlah orang ({partySize})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={partySize <= 1}
                  onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                  className="h-8 w-8 rounded-full border border-[#e6c98a] bg-white flex items-center justify-center text-sm font-medium text-[#6b4a2b] hover:bg-[#fff6e6] disabled:opacity-40"
                >
                  −
                </button>
                <span className="flex-1 text-center text-lg font-semibold text-[#6b4a2b]">
                  {partySize}
                </span>
                <button
                  type="button"
                  disabled={partySize >= maxPartySize}
                  onClick={() => setPartySize((n) => Math.min(maxPartySize, n + 1))}
                  className="h-8 w-8 rounded-full border border-[#e6c98a] bg-white flex items-center justify-center text-sm font-medium text-[#6b4a2b] hover:bg-[#fff6e6] disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <p className="mt-1 text-xs text-[#5a4a3a]">
                Maksimal {maxPartySize} orang per meja.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: contact + confirm */}
        {step === "confirm" && (
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[#6b4a2b]">
              Masukkan Info Kontak & Konfirmasi
            </h2>

            <div className="mb-4 rounded-lg bg-[#FFF6E6] p-3 text-sm">
              <span className="font-medium text-[#6b4a2b]">Ringkasan:</span>
              <span className="ml-2 text-[#5a4a3a]">
                {selectedDate} · {selectedSlot?.name} (
                {selectedSlot?.startTime}–{selectedSlot?.endTime}) · {partySize} orang
              </span>
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
