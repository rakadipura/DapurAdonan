"use client";

import { useState } from "react";
import { toast } from "sonner";

interface RescheduleFormProps {
  booking: { code: string; phone: string; slotId: number; partySize: number };
  dateOptions: { date: string; label: string }[];
}

export function RescheduleForm({ booking, dateOptions }: RescheduleFormProps) {
  const [show, setShow] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newSlotId, setNewSlotId] = useState("");
  const [slots, setSlots] = useState<{ id: number; name: string; startTime: string; endTime: string; capacity: number; remaining: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDateChange = async (date: string) => {
    setNewDate(date);
    setNewSlotId("");
    setSlots([]);
    setError("");
    if (!date) return;
    try {
      const res = await fetch(`/api/bookings/slots?date=${date}`);
      if (!res.ok) throw new Error("Failed to load slots");
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setError("Gagal memuat jadwal. Coba refresh halaman.");
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newSlotId) {
      setError("Pilih tanggal dan waktu baru terlebih dahulu");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: booking.code, phone: booking.phone, newDate, newSlotId: parseInt(newSlotId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menjadwal ulang. Coba lagi.");
        setLoading(false);
        return;
      }
      toast.success("Booking berhasil dijadwal ulang");
      window.location.reload();
    } catch {
      setError("Terjadi kesalahan jaringan. Periksa koneksi dan coba lagi.");
      setLoading(false);
    }
  };

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="w-full rounded-lg border border-[#A0522D] bg-white px-4 py-3 text-sm font-semibold text-[#6b4a2b] transition hover:bg-[#fffaf0]"
      >
        Jadwal Ulang
      </button>
    );
  }

  return (
    <div className="space-y-3 border-t border-[#efe2c7] pt-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Tanggal baru</label>
        <select
          value={newDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full rounded-lg border border-[#e6c98a] bg-[#fffaf0] px-3 py-2 text-sm focus:border-[#A0522D]"
        >
          <option value="">Pilih tanggal</option>
          {dateOptions.map((opt) => (
            <option key={opt.date} value={opt.date}>{opt.label}</option>
          ))}
        </select>
      </div>
      {slots.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-[#6b4a2b]">Waktu baru</label>
          <div className="grid gap-2">
            {slots.map((slot) => (
              <button
                key={slot.id}
                type="button"                  disabled={slot.remaining < booking.partySize}
                onClick={() => setNewSlotId(String(slot.id))}
                className={`rounded-lg border p-3 text-left transition ${
                  newSlotId === String(slot.id)
                    ? "border-[#A0522D] bg-[#fffaf0] text-[#6b4a2b] font-medium"
                    : slot.remaining < booking.partySize
                    ? "border-[#e6c98a] bg-gray-50 opacity-60"
                    : "border-[#e6c98a] bg-white hover:border-[#A0522D]"
                }`}
              >
                <div className="flex justify-between">
                  <span>{slot.name} · {slot.startTime} – {slot.endTime}</span>
                  <span className="text-sm">{slot.remaining} kursi tersedia</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => setShow(false)}
          className="flex-1 rounded-lg border border-[#e6c98a] bg-white px-4 py-2 text-sm font-medium text-[#5a4a3a] transition hover:bg-[#fffaf0]"
        >
          Batal
        </button>
        <button
          onClick={handleReschedule}
          disabled={loading || !newDate || !newSlotId}
          className="flex-1 rounded-lg border-0 bg-[#A0522D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8b4513] disabled:opacity-50"
        >
          {loading ? "Memproses…" : "Simpan Jadwal Baru"}
        </button>
      </div>
    </div>
  );
}