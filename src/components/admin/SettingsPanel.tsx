"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { PlusIcon, Trash2Icon, EditIcon } from "lucide-react";

interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

type SettingType = "string" | "number" | "json" | "boolean";

interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  type: SettingType;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

// NOTE: the booking seat limit is no longer a global setting — it is each
// BookingSlot's `capacity` ("Kapasitas Kursi"), maintained from /admin/slots.
const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    key: "bookingLeadHours",
    label: "Lead Time Booking (jam)",
    description: "Minimal jam sebelum booking bisa dilakukan",
    type: "number",
    placeholder: "1",
  },
  {
    key: "orderCutoffHour",
    label: "Jam Tutup Pesanan (WIB)",
    description: "Jam (0-23) setelahnya pesanan hari ini tidak diterima",
    type: "number",
    placeholder: "16",
  },
  {
    key: "waNumber",
    label: "Nomor WhatsApp",
    description: "Nomor WhatsApp toko (format 628xxxxxxxxxx)",
    type: "string",
    placeholder: "6281234567890",
  },
  {
    key: "transferBank",
    label: "Info Transfer Bank",
    description: "Detail rekening untuk pembayaran transfer",
    type: "string",
    placeholder: "BCA 1234567890 a.n. Toko Mini Moni",
  },
  {
    key: "pickupWindows",
    label: "Jadwal Pengambilan (JSON)",
    description: 'Array jam ambil: [{"start":"09:00","end":"12:00"},{"start":"13:00","end":"17:00"}]',
    type: "json",
    placeholder: '[{"start":"09:00","end":"12:00"}]',
  },
  {
    key: "deliveryZones",
    label: "Zona Pengiriman (JSON)",
    description: 'Array zona: [{"zone":"Pusat","baseFee":10000,"perKm":2000,"maxKm":10,"freeMin":100000}]',
    type: "json",
    placeholder: '[{"zone":"Pusat","baseFee":10000,"perKm":2000,"maxKm":10,"freeMin":100000}]',
  },
];

function getDefinition(key: string): SettingDefinition | undefined {
  return SETTING_DEFINITIONS.find((d) => d.key === key);
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  const [formValue, setFormValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountedRef = useRef(true);

  const loadSettings = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat pengaturan");
      if (mountedRef.current) setSettings(data.settings);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Gagal memuat pengaturan");
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
    return () => { mountedRef.current = false; };
  }, []);

  const validateForm = (key: string, value: string): boolean => {
    const def = getDefinition(key);
    if (!def) return true;

    try {
      switch (def.type) {
        case "number":
          if (!value.trim()) return true;
          const num = Number(value);
          if (!Number.isFinite(num)) {
            setFormError("Harus berupa angka");
            return false;
          }
          break;
        case "json":
          if (!value.trim()) return true;
          JSON.parse(value);
          break;
        case "boolean":
          if (!["true", "false"].includes(value.toLowerCase())) {
            setFormError("Harus true atau false");
            return false;
          }
          break;
      }
    } catch {
      setFormError("Format JSON tidak valid");
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetting) return;
    if (!validateForm(editingSetting.key, formValue)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/settings/${editingSetting.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: formValue }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pengaturan");

      toast.add({ title: "Pengaturan diperbarui", type: "success" });
      closeModal();
      loadSettings();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal menyimpan pengaturan", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (setting: Setting) => {
    const def = getDefinition(setting.key);
    setEditingSetting(setting);
    setFormValue(setting.value);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSetting(null);
    setFormValue("");
    setFormError(null);
  };

  const handleDelete = async (key: string) => {
    const def = getDefinition(key);
    const label = def?.label || key;
    if (!confirm(`Hapus pengaturan "${label}"?`)) return;
    try {
      const res = await fetch(`/api/admin/settings/${key}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      toast.add({ title: "Pengaturan dihapus", type: "success" });
      loadSettings();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal menghapus pengaturan", type: "error" });
    }
  };

  const getDefaultValue = (key: string): string => {
    const def = getDefinition(key);
    if (!def) return "";
    switch (def.type) {
      case "number":
        return def.placeholder || "0";
      case "json":
        return "[]";
      case "boolean":
        return "false";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#6b4a2b]">Pengaturan Toko</h1>
        <p className="text-sm text-[#5a4a3a]">Kelola konfigurasi toko dan fitur.</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button onClick={() => {
          const firstDef = SETTING_DEFINITIONS[0];
          setEditingSetting({ key: firstDef.key, value: getDefaultValue(firstDef.key), updatedAt: new Date().toISOString() });
          setFormValue(getDefaultValue(firstDef.key));
          setFormError(null);
          setIsModalOpen(true);
        }} size="sm">
          <PlusIcon className="size-4" /> Tambah Pengaturan
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-[#5a4a3a]">Memuat…</p>
      ) : settings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
          Belum ada pengaturan. Tambah pengaturan pertama.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#efe2c7] bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-[#efe2c7] text-left text-xs text-[#5a4a3a]">
                <th className="px-4 py-3 font-medium">Key</th>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Nilai</th>
                <th className="px-4 py-3 font-medium">Deskripsi</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => {
                const def = getDefinition(setting.key);
                return (
                  <tr key={setting.key} className="border-b border-[#f2e9d5] last:border-0">
                    <td className="px-4 py-3 font-mono text-sm text-[#6b4a2b]">{setting.key}</td>
                    <td className="px-4 py-3 text-[#5a4a3a]">{def?.label || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-[#fffaf0] px-2 py-0.5 text-xs font-medium text-[#A0522D]">
                        {def?.type || "string"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#5a4a3a] max-w-xs truncate font-mono text-xs">{setting.value}</td>
                    <td className="px-4 py-3 text-[#5a4a3a] text-xs max-w-xs truncate">{def?.description || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditModal(setting)}>
                          <EditIcon className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(setting.key)} className="text-red-600 hover:text-red-700">
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSetting ? "Edit Pengaturan" : "Tambah Pengaturan"}</DialogTitle>
            <DialogDescription>
              {editingSetting ? getDefinition(editingSetting.key)?.description : "Pilih pengaturan dari daftar di bawah untuk menambah baru."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            {editingSetting ? (
              <>
                <div>
                  <Label>Key</Label>
                  <Input value={editingSetting.key} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label htmlFor="value">Nilai *</Label>
                  {getDefinition(editingSetting.key)?.type === "json" ? (
                    <Textarea
                      id="value"
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      rows={6}
                      className="font-mono text-sm"
                      placeholder={getDefinition(editingSetting.key)?.placeholder}
                    />
                  ) : (
                    <Input
                      id="value"
                      type={getDefinition(editingSetting.key)?.type === "number" ? "number" : "text"}
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      placeholder={getDefinition(editingSetting.key)?.placeholder}
                    />
                  )}
                  {formError && <p className="text-xs text-red-600 mt-1">{formError}</p>}
                  <p className="text-xs text-[#5a4a3a] mt-1">{getDefinition(editingSetting.key)?.description}</p>
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="newKey">Pilih Pengaturan</Label>
                <select
                  id="newKey"
                  value={formValue}
                  onChange={(e) => {
                    const key = e.target.value;
                    setFormValue(key);
                    const def = getDefinition(key);
                    if (def) {
                      setEditingSetting({ key, value: getDefaultValue(key), updatedAt: new Date().toISOString() });
                      setFormValue(getDefaultValue(key));
                    }
                  }}
                  className="w-full rounded-lg border border-[#e6c98a] bg-white px-3 py-2 text-sm focus:border-[#A0522D] focus:outline-none"
                >
                  <option value="">-- Pilih pengaturan --</option>
                  {SETTING_DEFINITIONS.map((def) => (
                    <option key={def.key} value={def.key}>
                      {def.label} ({def.key})
                    </option>
                  ))}
                </select>
                {!formValue && <p className="text-xs text-[#5a4a3a] mt-1">Pilih pengaturan untuk menambah baru</p>}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
              {editingSetting && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan…" : "Simpan Perubahan"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}