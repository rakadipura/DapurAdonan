"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { PlusIcon, Trash2Icon, EditIcon } from "lucide-react";
import { formatRupiah } from "@/lib/money";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Variant {
  id?: number;
  name: string;
  priceDiff: number;
  isDefault: boolean;
  sortOrder: number;
}

interface AddOn {
  id?: number;
  name: string;
  price: number;
  isRequired: boolean;
  sortOrder: number;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  imageUrl: string | null;
  dailyStock: number | null;
  isAvailable: boolean;
  leadTimeDays: number;
  isCustomCake: boolean;
  allergens: string[];
  tags: string[];
  categoryId: number;
  category: Category;
  variants: Variant[];
  addOns: AddOn[];
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  dailyStock: number | null;
  isAvailable: boolean;
  leadTimeDays: number;
  isCustomCake: boolean;
  allergens: string[];
  tags: string[];
  categoryId: number;
  variants: Variant[];
  addOns: AddOn[];
}

const ALLERGEN_OPTIONS = ["nuts", "dairy", "gluten", "eggs", "soy", "shellfish"];
const TAG_OPTIONS = ["best-seller", "vegan", "gluten-free", "vegetarian", "sugar-free", "halal", "new", "seasonal"];

const emptyFormData: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  basePrice: 0,
  imageUrl: "",
  dailyStock: null,
  isAvailable: true,
  leadTimeDays: 0,
  isCustomCake: false,
  allergens: [],
  tags: [],
  categoryId: 0,
  variants: [],
  addOns: [],
};

export function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountedRef = useRef(true);

  const loadProducts = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat produk");
      if (mountedRef.current) setProducts(data.products);
    } catch (err) {
      if (mountedRef.current) setError(err instanceof Error ? err.message : "Gagal memuat produk");
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (res.ok && mountedRef.current) setCategories(data.categories);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadProducts();
    loadCategories();
    return () => { mountedRef.current = false; };
  }, [loadProducts, loadCategories]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "" || p.categoryId === parseInt(categoryFilter);
    const matchesAvailability = availabilityFilter === "all" ||
      (availabilityFilter === "available" && p.isAvailable) ||
      (availabilityFilter === "unavailable" && !p.isAvailable);
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const validateForm = (data: ProductFormData): boolean => {
    const errors: Partial<Record<keyof ProductFormData, string>> = {};
    if (!data.name.trim()) errors.name = "Wajib diisi";
    if (!data.slug.trim()) errors.slug = "Wajib diisi";
    if (data.basePrice < 0) errors.basePrice = "Harga minimal 0";
    if (!data.categoryId) errors.categoryId = "Wajib dipilih";
    if (data.isCustomCake && data.leadTimeDays < 0) errors.leadTimeDays = "Minimal 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(formData)) return;

    setIsSubmitting(true);
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const payload = {
        ...formData,
        dailyStock: formData.dailyStock === 0 ? 0 : formData.dailyStock,
        imageUrl: formData.imageUrl || null,
        allergens: formData.allergens,
        tags: formData.tags,
        variants: formData.variants.map((v, i) => ({ ...v, sortOrder: i })),
        addOns: formData.addOns.map((a, i) => ({ ...a, sortOrder: i })),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan produk");

      toast.add({ title: editingProduct ? "Produk diperbarui" : "Produk dibuat", type: "success" });
      closeModal();
      loadProducts();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal menyimpan produk", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyFormData);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      basePrice: product.basePrice,
      imageUrl: product.imageUrl || "",
      dailyStock: product.dailyStock,
      isAvailable: product.isAvailable,
      leadTimeDays: product.leadTimeDays,
      isCustomCake: product.isCustomCake,
      allergens: product.allergens,
      tags: product.tags,
      categoryId: product.categoryId,
      variants: product.variants.map((v) => ({ ...v })),
      addOns: product.addOns.map((a) => ({ ...a })),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyFormData);
    setFormErrors({});
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      toast.add({ title: "Produk dihapus", type: "success" });
      loadProducts();
    } catch (err) {
      toast.add({ title: err instanceof Error ? err.message : "Gagal menghapus produk", type: "error" });
    }
  };

  const addVariant = () => {
    const newVariant: Variant = { name: "", priceDiff: 0, isDefault: formData.variants.length === 0, sortOrder: formData.variants.length };
    setFormData((prev) => ({ ...prev, variants: [...prev.variants, newVariant] }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | boolean) => {
    setFormData((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const addAddOn = () => {
    const newAddOn: AddOn = { name: "", price: 0, isRequired: false, sortOrder: formData.addOns.length };
    setFormData((prev) => ({ ...prev, addOns: [...prev.addOns, newAddOn] }));
  };

  const removeAddOn = (index: number) => {
    setFormData((prev) => ({ ...prev, addOns: prev.addOns.filter((_, i) => i !== index) }));
  };

  const updateAddOn = (index: number, field: keyof AddOn, value: string | number | boolean) => {
    setFormData((prev) => {
      const addOns = [...prev.addOns];
      addOns[index] = { ...addOns[index], [field]: value };
      return { ...prev, addOns };
    });
  };

  const toggleAllergen = (allergen: string) => {
    setFormData((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#6b4a2b]">Produk</h1>
        <p className="text-sm text-[#5a4a3a]">Kelola produk, varian, dan add-on.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button onClick={openAddModal} size="sm">
          <PlusIcon className="size-4" /> Tambah Produk
        </Button>

        <div className="flex flex-wrap gap-2 ml-auto">
          <Input
            placeholder="Cari nama produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <div className="w-40">
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === "all" || v === null ? "" : v)}>
              <SelectTrigger size="sm"><SelectValue placeholder="Semua kategori" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={availabilityFilter} onValueChange={(v) => setAvailabilityFilter(v as "all" | "available" | "unavailable")}>
              <SelectTrigger size="sm"><SelectValue placeholder="Ketersediaan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="available">Tersedia</SelectItem>
                <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-[#5a4a3a]">Memuat…</p>
      ) : filteredProducts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
          Tidak ada produk.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#efe2c7] bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-[#efe2c7] text-left text-xs text-[#5a4a3a]">
                <th className="px-4 py-3 font-medium">Produk</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Harga</th>
                <th className="px-4 py-3 font-medium">Stok Harian</th>
                <th className="px-4 py-3 font-medium">Varian</th>
                <th className="px-4 py-3 font-medium">Add-on</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-[#f2e9d5] last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#6b4a2b]">{product.name}</p>
                    <p className="text-xs text-[#5a4a3a]">{product.slug}</p>
                    {product.isCustomCake && <span className="inline-block mt-1 text-xs rounded bg-purple-100 px-1.5 py-0.5 text-purple-700">Custom Cake</span>}
                  </td>
                  <td className="px-4 py-3 text-[#5a4a3a]">{product.category.name}</td>
                  <td className="px-4 py-3 font-medium text-[#6b4a2b]">{formatRupiah(product.basePrice)}</td>
                  <td className="px-4 py-3 text-[#5a4a3a]">{product.dailyStock === null ? "Unlimited" : product.dailyStock}</td>
                  <td className="px-4 py-3 text-[#5a4a3a]">{product.variants.length}</td>
                  <td className="px-4 py-3 text-[#5a4a3a]">{product.addOns.length}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {product.isAvailable ? "Tersedia" : "Tidak Tersedia"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditModal(product)}>
                        <EditIcon className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(product.id, product.name)} className="text-red-600 hover:text-red-700">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
            <DialogDescription>Isi data produk di bawah ini. Kolom wajib ditandai *</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">Nama Produk *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} aria-invalid={formErrors.name ? "true" : "false"} />
                {formErrors.name && <p className="text-xs text-red-600 mt-1">Wajib diisi</p>}
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} aria-invalid={formErrors.slug ? "true" : "false"} />
                {formErrors.slug && <p className="text-xs text-red-600 mt-1">Wajib diisi</p>}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
              </div>
              <div>
                <Label htmlFor="basePrice">Harga Dasar (Rp) *</Label>
                <Input id="basePrice" type="number" min="0" step="100" value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })} aria-invalid={formErrors.basePrice ? "true" : "false"} />
              </div>
              <div>
                <Label htmlFor="imageUrl">URL Gambar</Label>
                <Input id="imageUrl" type="url" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} placeholder="/images/products/nastar.svg" />
                <p className="text-xs text-[#5a4a3a] mt-1">Gunakan path relatif (contoh: /images/products/nama-file.jpg) atau URL penuh</p>
              </div>
              <div>
                <Label htmlFor="dailyStock">Stok Harian</Label>
                <Input id="dailyStock" type="number" min="0" value={formData.dailyStock?.toString() ?? ""} onChange={(e) => setFormData({ ...formData, dailyStock: e.target.value === "" ? null : parseInt(e.target.value) })} placeholder="Kosongkan = unlimited" />
              </div>
              <div>
                <Label htmlFor="categoryId">Kategori *</Label>
                <Select value={String(formData.categoryId)} onValueChange={(v) => setFormData({ ...formData, categoryId: v ? parseInt(v) : 0 })} aria-invalid={formErrors.categoryId ? "true" : "false"}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.categoryId && <p className="text-xs text-red-600 mt-1">Wajib dipilih</p>}
              </div>
              <div>
                <Label htmlFor="leadTimeDays">Lead Time (hari)</Label>
                <Input id="leadTimeDays" type="number" min="0" value={formData.leadTimeDays} onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })} aria-invalid={formErrors.leadTimeDays ? "true" : "false"} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isAvailable" checked={formData.isAvailable} onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })} className="rounded border-[#e6c98a] text-[#A0522D] focus:ring-[#A0522D]" />
              <Label htmlFor="isAvailable" className="cursor-pointer">Tersedia</Label>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isCustomCake" checked={formData.isCustomCake} onChange={(e) => setFormData({ ...formData, isCustomCake: e.target.checked })} className="rounded border-[#e6c98a] text-[#A0522D] focus:ring-[#A0522D]" />
              <Label htmlFor="isCustomCake" className="cursor-pointer">Custom Cake (butuh lead time)</Label>
            </div>

            <div className="space-y-2">
              <Label>Alergen</Label>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((a) => (
                  <Label key={a} className="cursor-pointer inline-flex items-center gap-1 rounded border border-[#e6c98a] bg-white px-2 py-1 text-sm text-[#6b4a2b] hover:border-[#A0522D]">
                    <input type="checkbox" checked={formData.allergens.includes(a)} onChange={() => toggleAllergen(a)} className="rounded border-[#e6c98a] text-[#A0522D] focus:ring-[#A0522D]" />
                    {a}
                  </Label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tag</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS.map((t) => (
                  <Label key={t} className="cursor-pointer inline-flex items-center gap-1 rounded border border-[#e6c98a] bg-white px-2 py-1 text-sm text-[#6b4a2b] hover:border-[#A0522D]">
                    <input type="checkbox" checked={formData.tags.includes(t)} onChange={() => toggleTag(t)} className="rounded border-[#e6c98a] text-[#A0522D] focus:ring-[#A0522D]" />
                    {t}
                  </Label>
                ))}
              </div>
            </div>

            <div className="border-t border-[#efe2c7] pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[#6b4a2b]">Varian</h3>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <PlusIcon className="size-4" /> Tambah
                </Button>
              </div>
              {formData.variants.map((variant, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 p-2 bg-[#fffaf0] rounded-lg">
                  <Input placeholder="Nama varian (contoh: Small 6 inch)" value={variant.name} onChange={(e) => updateVariant(i, "name", e.target.value)} className="flex-1 min-w-[150px]" />
                  <Input type="number" placeholder="Harga tambahan" value={variant.priceDiff} onChange={(e) => updateVariant(i, "priceDiff", parseInt(e.target.value) || 0)} className="w-32" step="100" />
                  <Input type="number" placeholder="Urutan" value={variant.sortOrder} onChange={(e) => updateVariant(i, "sortOrder", parseInt(e.target.value) || 0)} className="w-20" />
                  <Label className="flex items-center gap-1 cursor-pointer text-sm">
                    <input type="checkbox" checked={variant.isDefault} onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          variants: prev.variants.map((v, idx) => ({ ...v, isDefault: idx === i }))
                        }));
                      } else {
                        updateVariant(i, "isDefault", false);
                      }
                    }} className="rounded border-[#e6c98a] text-[#A0522D] focus:ring-[#A0522D]" />
                    Default
                  </Label>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeVariant(i)} className="text-red-600">
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
              {formData.variants.length === 0 && <p className="text-sm text-[#5a4a3a]">Belum ada varian. Produk akan menggunakan harga dasar.</p>}
            </div>

            <div className="border-t border-[#efe2c7] pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-[#6b4a2b]">Add-on</h3>
                <Button type="button" variant="outline" size="sm" onClick={addAddOn}>
                  <PlusIcon className="size-4" /> Tambah
                </Button>
              </div>
              {formData.addOns.map((addOn, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 p-2 bg-[#fffaf0] rounded-lg">
                  <Input placeholder="Nama add-on (contoh: Extra frosting)" value={addOn.name} onChange={(e) => updateAddOn(i, "name", e.target.value)} className="flex-1 min-w-[150px]" />
                  <Input type="number" placeholder="Harga" min="0" value={addOn.price} onChange={(e) => updateAddOn(i, "price", parseInt(e.target.value) || 0)} className="w-28" step="100" />
                  <Input type="number" placeholder="Urutan" value={addOn.sortOrder} onChange={(e) => updateAddOn(i, "sortOrder", parseInt(e.target.value) || 0)} className="w-20" />
                  <Label className="flex items-center gap-1 cursor-pointer text-sm">
                    <input type="checkbox" checked={addOn.isRequired} onChange={(e) => updateAddOn(i, "isRequired", e.target.checked)} className="rounded border-[#e6c98a] text-[#A0522D] focus:ring-[#A0522D]" />
                    Wajib
                  </Label>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeAddOn(i)} className="text-red-600">
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
              {formData.addOns.length === 0 && <p className="text-sm text-[#5a4a3a]">Belum ada add-on.</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan…" : editingProduct ? "Simpan Perubahan" : "Buat Produk"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}