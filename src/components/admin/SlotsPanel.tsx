"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { PlusIcon, Trash2Icon, EditIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";

interface Slot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
  order: number;
}

interface SlotFormData {
  name: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isActive: boolean;
  order: number;
}

const emptyFormData: SlotFormData = {
  name: "",
  startTime: "09:00",
  endTime: "11:00",
  capacity: 4,
  isActive: true,
  order: 0,
};

export function SlotsPanel() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [formData, setFormData] = useState<SlotFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SlotFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountedRef = useRef(true);

  const loadSlots = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/slots");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat jadwal");
      if (mountedRef.current) setSlots(data.slots);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Gagal memuat jadwal");
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();
    return () => { mountedRef.current = false; };
  }, []);

  const validateForm = (data: SlotFormData): boolean => {
    const errors: Partial<Record<keyof SlotFormData, string>> = {};
    if (!data.name.trim()) errors.name = "Wajib diisi";
    if (!/^\d{2}:\d{2}$/.test(data.startTime)) errors.startTime = "Format HH:mm";
    if (!/^\d{2}:\d{2}$/.test(data.endTime)) errors.endTime = "Format HH:mm";
    if (data.capacity < 1) errors.capacity = "Minimal 1";
    if (data.startTime >= data.endTime) {
      errors.startTime = "Harus sebelum jam selesai";
      errors.endTime = "Harus setelah jam mulai";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const url = editingSlot ? `/api/admin/slots/${editingSlot.id}` : "/api/admin/slots";
      const method = editingSlot ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan jadwal");

      toast.add({ title: editingSlot ? "Jadwal diperbarui" : "Jadwal dibuat", type: "success" });
      closeModal();
      loadSlots();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal menyimpan jadwal", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    const nextOrder = slots.length > 0 ? Math.max(...slots.map(s => s.order)) + 1 : 0;
    setEditingSlot(null);
    setFormData({ ...emptyFormData, order: nextOrder });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (slot: Slot) => {
    setEditingSlot(slot);
    setFormData({
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      isActive: slot.isActive,
      order: slot.order,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSlot(null);
    setFormData(emptyFormData);
    setFormErrors({});
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus jadwal "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/slots/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      toast.add({ title: "Jadwal dihapus", type: "success" });
      loadSlots();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal menghapus jadwal", type: "error" });
    }
  };

  const moveSlot = async (id: number, direction: "up" | "down") => {
    const slot = slots.find(s => s.id === id);
    if (!slot) return;

    const targetOrder = direction === "up" ? slot.order - 1 : slot.order + 1;
    const targetSlot = slots.find(s => s.order === targetOrder);
    if (!targetSlot) return;

    try {
      // Swap orders
      await Promise.all([
        fetch(`/api/admin/slots/${slot.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: targetOrder }),
        }),
        fetch(`/api/admin/slots/${targetSlot.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: slot.order }),
        }),
      ]);
      loadSlots();
    } catch (err) {
      toast.add({ title: "Gagal mengubah urutan", type: "error" });
    }
  };

  const toggleActive = async (slot: Slot) => {
    try {
      const res = await fetch(`/api/admin/slots/${slot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !slot.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui");
      loadSlots();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal memperbarui status", type: "error" });
    }
  };

  const sortedSlots = [...slots].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#6b4a2b]">Jadwal Booking</h1>
        <p className="text-sm text-[#5a4a3a]">Kelola jadwal slot booking meja.</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button onClick={openAddModal} size="sm">
          <PlusIcon className="size-4" /> Tambah Slot
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-[#5a4a3a]">Memuat…</p>
      ) : slots.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
          Belum ada jadwal. Tambah slot pertama.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#efe2c7] bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-[#efe2c7] text-left text-xs text-[#5a4a3a]">
                <th className="px-4 py-3 font-medium w-8">Urutan</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Kapasitas</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedSlots.map((slot, index) => (
                <tr key={slot.id} className="border-b border-[#f2e9d5] last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => moveSlot(slot.id, "up")}
                        disabled={index === 0}
                        className="text-[#5a4a3a] hover:text-[#A0522D] disabled:opacity-30"
                      >
                        <ChevronUpIcon className="size-4" />
                      </Button>
                      <span className="font-mono font-medium text-[#6b4a2b] w-6 text-center">{slot.order + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => moveSlot(slot.id, "down")}
                        disabled={index === sortedSlots.length - 1}
                        className="text-[#5a4a3a] hover:text-[#A0522D] disabled:opacity-30"
                      >
                        <ChevronDownIcon className="size-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#6b4a2b]">{slot.name}</p>
                  </td>
                  <td className="px-4 py-3 text-[#5a4a3a]">{slot.startTime} – {slot.endTime} WIB</td>
                  <td className="px-4 py-3 text-[#5a4a3a]">{slot.capacity} orang</td>
                  <td className="px-4 py-3">
                    <Button
                      variant={slot.isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleActive(slot)}
                      className={slot.isActive ? "bg-green-600 hover:bg-green-700" : "border-gray-300 text-gray-600 hover:bg-gray-100"}
                    >
                      {slot.isActive ? "Aktif" : "Nonaktif"}
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditModal(slot)}>
                        <EditIcon className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(slot.id, slot.name)} className="text-red-600 hover:text-red-700">
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Jadwal" : "Tambah Jadwal"}</DialogTitle>
            <DialogDescription>Isi data jadwal booking di bawah ini. Kolom wajib ditandai *</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div>
              <Label htmlFor="name">Nama Slot *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} aria-invalid={formErrors.name ? "true" : "false"} placeholder="Contoh: Pagi, Siang, Sore" />
              {formErrors.name && <p className="text-xs text-red-600 mt-1">Wajib diisi</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startTime">Jam Mulai (HH:mm) *</Label>
                <Input id="startTime" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} aria-invalid={formErrors.startTime ? "true" : "false"} step="900" />
                {formErrors.startTime && <p className="text-xs text-red-600 mt-1">Format HH:mm, harus sebelum jam selesai</p>}
              </div>
              <div>
                <Label htmlFor="endTime">Jam Selesai (HH:mm) *</Label>
                <Input id="endTime" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} aria-invalid={formErrors.endTime ? "true" : "false"} step="900" />
                {formErrors.endTime && <p className="text-xs text-red-600 mt-1">Format HH:mm, harus setelah jam mulai</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="capacity">Kapasitas *</Label>
                <Input id="capacity" type="number" min="1" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} aria-invalid={formErrors.capacity ? "true" : "false"} />
                {formErrors.capacity && <p className="text-xs text-red-600 mt-1">Minimal 1</p>}
              </div>
              <div>
                <Label htmlFor="order">Urutan Tampil</Label>
                <Input id="order" type="number" min="0" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="rounded border-[#e6c98a] text-[#A0522D] focus:ring-[#A0522D]" />
              <Label htmlFor="isActive" className="cursor-pointer">Aktif (tampil ke pelanggan)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : editingSlot ? "Simpan Perubahan" : "Buat Jadwal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}