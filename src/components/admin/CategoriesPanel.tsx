"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { PlusIcon, Trash2Icon, EditIcon } from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  _count?: { products: number };
}

interface CategoryFormData {
  name: string;
  slug: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
}

const emptyFormData: CategoryFormData = {
  name: "",
  slug: "",
  imageUrl: "",
  sortOrder: 0,
  isVisible: true,
};

export function CategoriesPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CategoryFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountedRef = useRef(true);

  const loadCategories = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat kategori");
      if (mountedRef.current) setCategories(data.categories);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Gagal memuat kategori");
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories();
    return () => { mountedRef.current = false; };
  }, []);

  const validateForm = (data: CategoryFormData): boolean => {
    const errors: Partial<Record<keyof CategoryFormData, string>> = {};
    if (!data.name.trim()) errors.name = "Wajib diisi";
    if (!data.slug.trim()) errors.slug = "Wajib diisi";
    if (!/^[a-z0-9-]+$/.test(data.slug)) errors.slug = "Slug hanya boleh huruf kecil, angka, dan strip";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const payload = {
        ...formData,
        imageUrl: formData.imageUrl || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan kategori");

      toast.add({ title: editingCategory ? "Kategori diperbarui" : "Kategori dibuat", type: "success" });
      closeModal();
      loadCategories();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal menyimpan kategori", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData(emptyFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl || "",
      sortOrder: category.sortOrder,
      isVisible: category.isVisible,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData(emptyFormData);
    setFormErrors({});
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Produk di dalamnya juga akan terhapus.`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      toast.add({ title: "Kategori dihapus", type: "success" });
      loadCategories();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal menghapus kategori", type: "error" });
    }
  };

  const toggleVisible = async (category: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !category.isVisible }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui");
      loadCategories();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal memperbarui status", type: "error" });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#6b4a2b]">Kategori Produk</h1>
        <p className="text-sm text-[#5a4a3a]">Kelola kategori untuk mengelompokkan produk.</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button onClick={openAddModal} size="sm">
          <PlusIcon className="size-4" /> Tambah Kategori
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-[#5a4a3a]">Memuat…</p>
      ) : categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
          Belum ada kategori. Tambah kategori pertama.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#efe2c7] bg-white">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-[#efe2c7] text-left text-xs text-[#5a4a3a]">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Urutan</th>
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Gambar</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-[#f2e9d5] last:border-0">
                  <td className="px-4 py-3 font-medium text-[#6b4a2b]">{category.name}</td>
                  <td className="px-4 py-3 text-[#5a4a3a] font-mono">{category.slug}</td>
                  <td className="px-4 py-3 text-[#5a4a3a]">{category.sortOrder}</td>
                  <td className="px-4 py-3 text-[#5a4a3a]">{category._count?.products ?? 0}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant={category.isVisible ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVisible(category)}
                      className={category.isVisible ? "bg-green-600 hover:bg-green-700" : "border-gray-300 text-gray-600 hover:bg-gray-100"}
                    >
                      {category.isVisible ? "Tampil" : "Sembunyikan"}
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/categories/placeholder.svg";
                        }}
                      />
                    ) : (
                      <span className="text-xs text-[#5a4a3a]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditModal(category)}>
                        <EditIcon className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(category.id, category.name)} className="text-red-600 hover:text-red-700">
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
            <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
            <DialogDescription>Isi data kategori di bawah ini. Kolom wajib ditandai *</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div>
              <Label htmlFor="name">Nama Kategori *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} aria-invalid={formErrors.name ? "true" : "false"} placeholder="Contoh: Kue Kering" />
              {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} aria-invalid={formErrors.slug ? "true" : "false"} placeholder="contoh: kue-kering" />
              {formErrors.slug && <p className="text-xs text-red-600 mt-1">{formErrors.slug}</p>}
              <p className="text-xs text-[#5a4a3a] mt-1">Hanya huruf kecil, angka, dan strip. Digunakan di URL.</p>
            </div>

            <div>
              <Label htmlFor="imageUrl">URL Gambar</Label>
              <Input id="imageUrl" type="url" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="/images/categories/minuman.svg" />
              <p className="text-xs text-[#5a4a3a] mt-1">Gunakan path relatif (contoh: /images/categories/nama-file.svg) atau URL penuh</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sortOrder">Urutan Tampil</Label>
                <Input id="sortOrder" type="number" min="0" value={formData.sortOrder} onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" id="isVisible" checked={formData.isVisible} onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })} className="rounded border-[#e6c98a] text-[#A0522D] focus:ring-[#A0522D]" />
                <Label htmlFor="isVisible" className="cursor-pointer">Tampil ke pelanggan</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : editingCategory ? "Simpan Perubahan" : "Buat Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}