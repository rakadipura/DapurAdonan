"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { GripVerticalIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";

interface BookingMenuCategoryConfig {
  categoryId: number;
  categoryName: string;
  isVisible: boolean;
  sortOrder: number;
}

export function BookingMenuCategoriesPanel() {
  const [categories, setCategories] = useState<BookingMenuCategoryConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);

  const loadCategories = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/booking-menu-categories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat kategori menu booking");
      if (mountedRef.current) setCategories(data.categories);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Gagal memuat kategori menu booking");
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mountedRef.current) {
      loadCategories();
    }
  }, [loadCategories]);

  const handleVisibilityToggle = (categoryId: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.categoryId === categoryId ? { ...cat, isVisible: !cat.isVisible } : cat
      )
    );
  };

  const handleSortOrderChange = (categoryId: number, newSortOrder: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.categoryId === categoryId ? { ...cat, sortOrder: newSortOrder } : cat
      )
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setCategories((prev) => {
      const newCategories = [...prev];
      const item = newCategories[index];
      const newIndex = index - 1;
      // Swap sortOrder with the item above
      newCategories[index] = { ...newCategories[newIndex], sortOrder: item.sortOrder };
      newCategories[newIndex] = { ...item, sortOrder: newCategories[newIndex].sortOrder };
      return newCategories;
    });
  };

  const moveDown = (index: number) => {
    setCategories((prev) => {
      if (index >= prev.length - 1) return prev;
      const newCategories = [...prev];
      const item = newCategories[index];
      const newIndex = index + 1;
      newCategories[index] = { ...newCategories[newIndex], sortOrder: item.sortOrder };
      newCategories[newIndex] = { ...item, sortOrder: newCategories[newIndex].sortOrder };
      return newCategories;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/booking-menu-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.add({ title: "Konfigurasi menu booking tersimpan", type: "success" });
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal menyimpan", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#6b4a2b]">Konfigurasi Menu Booking</h1>
        <p className="text-sm text-[#5a4a3a]">
          Atur kategori mana yang ditampilkan di menu pre-order booking dan urutannya.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-[#5a4a3a]">Memuat…</p>
      ) : categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
          Belum ada kategori produk. Tambah kategori di panel Kategori.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-[#efe2c7] bg-white">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#efe2c7] text-left text-xs text-[#5a4a3a]">
                  <th className="px-4 py-3 font-medium w-10 text-center">Urutan</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium w-20 text-center">Tampilkan</th>
                  <th className="px-4 py-3 font-medium w-10 text-center">Geser</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((cat, index) => (
                  <tr key={cat.categoryId} className="border-b border-[#f2e9d5] last:border-0">
                    <td className="px-4 py-3 text-center text-[#5a4a3a]">
                      <Input
                        type="number"
                        value={cat.sortOrder}
                        onChange={(e) => handleSortOrderChange(cat.categoryId, Number(e.target.value) || 0)}
                        min={0}
                        className="w-16 text-center text-sm font-mono"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#6b4a2b]">{cat.categoryName}</td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVisibilityToggle(cat.categoryId)}
                        className={cat.isVisible ? "text-[#A0522D]" : "text-[#d1a85e]"}
                        aria-label={cat.isVisible ? "Sembunyikan" : "Tampilkan"}
                      >
                        {cat.isVisible ? <EyeIcon className="size-5" /> : <EyeOffIcon className="size-5" />}
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="text-[#6b4a2b] hover:bg-[#fffaf0]"
                        >
                          <GripVerticalIcon className="size-4 rotate-90" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => moveDown(index)}
                          disabled={index === sortedCategories.length - 1}
                          className="text-[#6b4a2b] hover:bg-[#fffaf0]"
                        >
                          <GripVerticalIcon className="size-4 -rotate-90" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-[#5a4a3a]">
            <strong>Catatan:</strong> Perubahan hanya mempengaruhi tampilan menu di halaman booking pelanggan.
            Kategori yang disembunyikan tidak akan muncul, tapi produk tetap bisa dipesan via halaman Menu utama.
          </p>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : ""}
              Simpan Perubahan
            </Button>
          </div>
        </>
      )}
    </div>
  );
}