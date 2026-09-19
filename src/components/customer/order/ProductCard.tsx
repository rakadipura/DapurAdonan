"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/money";
import { useSession } from "@/components/customer/SessionProvider";
import type { Product, ProductVariant, AddOn, CartItem } from "@/types";

interface ProductCardProps {
  product: Product & {
    variants?: ProductVariant[];
    addOns?: AddOn[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useSession();
  const [showOptions, setShowOptions] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<Set<number>>(new Set());
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  const defaultVariant = product.variants?.find((v) => v.isDefault) || product.variants?.[0] || null;
  const variantPriceDiff = selectedVariant?.priceDiff ?? defaultVariant?.priceDiff ?? 0;
  const addOnsPrice = product.addOns
    ?.filter((a) => selectedAddOns.has(a.id))
    .reduce((sum, a) => sum + a.price, 0) ?? 0;
  const finalPrice = product.basePrice + variantPriceDiff + addOnsPrice;

  const stockLabel =
    product.dailyStock == null
      ? null
      : product.dailyStock === 0
      ? "Habis"
      : `${product.dailyStock} tersisa`;

  const isSoldOut = product.dailyStock === 0;

  const handleAddToCart = () => {
    if (isSoldOut) return;

    const requiredAddOns = product.addOns?.filter((a) => a.isRequired) ?? [];
    const missingRequired = requiredAddOns.filter((a) => !selectedAddOns.has(a.id));
    if (missingRequired.length > 0) {
      alert(`Pilih add-on wajib: ${missingRequired.map((a) => a.name).join(", ")}`);
      return;
    }

    const cartItem: CartItem = {
      productId: product.id,
      variantId: selectedVariant?.id ?? defaultVariant?.id,
      name: product.name,
      price: product.basePrice + variantPriceDiff,
      imageUrl: product.imageUrl,
      qty,
      notes,
      categoryName: product.category?.name,
      selectedAddOns: Array.from(selectedAddOns).map(String),
      addOnsPrice,
    };

    addToCart(cartItem);

    setShowOptions(false);
    setSelectedVariant(defaultVariant);
    setSelectedAddOns(new Set());
    setQty(1);
    setNotes("");
  };

  const toggleAddOn = (id: number) => {
    const newSet = new Set(selectedAddOns);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedAddOns(newSet);
  };

  if (product.isCustomCake) {
    return (
      <div className="group rounded-xl border border-[#efe2c7] bg-white p-4 shadow-sm transition hover:border-[#A0522D] hover:shadow-md">
        <div className="aspect-square overflow-hidden rounded-lg bg-[#FCE9C8]">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-[#e6c98a]">🎂</div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs text-[#A0522D] uppercase tracking-wider">{product.category?.name}</p>
          <h3 className="mt-0.5 text-base font-semibold text-[#6b4a2b]">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#5a4a3a]">{product.description}</p>
          {product.leadTimeDays > 0 && (
            <p className="mt-1 text-xs text-[#A0522D] font-medium">Pesan minimal {product.leadTimeDays} hari sebelumnya</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-[#6b4a2b]">Mulai {formatRupiah(product.basePrice)}</span>
            {stockLabel && (
              <span className={`text-xs font-medium ${isSoldOut ? "text-red-600" : "text-[#A0522D]"}`}>{stockLabel}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            disabled={isSoldOut}
            className="mt-3 w-full rounded-lg border-0 bg-[#A0522D] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#8b4513] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pesan Custom
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="group rounded-xl border border-[#efe2c7] bg-white p-4 shadow-sm transition hover:border-[#A0522D] hover:shadow-md">
        <div className="aspect-square overflow-hidden rounded-lg bg-[#FCE9C8]">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-[#e6c98a]">🍰</div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs text-[#A0522D] uppercase tracking-wider">{product.category?.name}</p>
          <h3 className="mt-0.5 text-base font-semibold text-[#6b4a2b]">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#5a4a3a]">{product.description}</p>
          {product.allergens.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.allergens.map((a) => (
                <span key={a} className="text-xs px-2 py-0.5 rounded bg-[#fff6e6] text-[#A0522D] border border-[#e6c98a]">{a}</span>
              ))}
            </div>
          )}
          {product.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {product.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#FCE9C8] text-[#A0522D]">{t}</span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-[#6b4a2b]">{formatRupiah(finalPrice)}</span>
            {stockLabel && (
              <span className={`text-xs font-medium ${isSoldOut ? "text-red-600" : "text-[#A0522D]"}`}>{stockLabel}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            disabled={isSoldOut}
            className="mt-3 w-full rounded-lg border-0 bg-[#A0522D] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#8b4513] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tambah ke Keranjang
          </button>
        </div>
      </div>

      {/* Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowOptions(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#6b4a2b]">{product.name}</h3>
              <button onClick={() => setShowOptions(false)} className="text-[#5a4a3a] hover:text-[#6b4a2b]">✕</button>
            </div>

            {/* Variant selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#6b4a2b] mb-2">Ukuran / Varian</label>
                <div className="grid gap-2">
                  {product.variants.map((v) => (
                    <label
                      key={v.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                        (selectedVariant?.id ?? defaultVariant?.id) === v.id
                          ? "border-[#A0522D] bg-[#FFF6E6]"
                          : "border-[#efe2c7] hover:border-[#A0522D]"
                      }`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      <span className="font-medium text-[#6b4a2b]">{v.name}</span>
                      <span className="text-sm text-[#5a4a3a]">
                        {v.priceDiff > 0 ? `+${formatRupiah(v.priceDiff)}` : v.priceDiff < 0 ? formatRupiah(v.priceDiff) : "Standar"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {product.addOns && product.addOns.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#6b4a2b] mb-2">Tambahan</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {product.addOns.map((a) => (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition ${
                        selectedAddOns.has(a.id)
                          ? "border-[#A0522D] bg-[#FFF6E6]"
                          : "border-[#efe2c7] hover:border-[#A0522D]"
                      }`}
                      onClick={() => toggleAddOn(a.id)}
                    >
                      <div>
                        <span className="font-medium text-[#6b4a2b]">{a.name}</span>
                        {a.isRequired && <span className="ml-1 text-xs text-red-600">(wajib)</span>}
                      </div>
                      <span className="text-sm text-[#5a4a3a]">{formatRupiah(a.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#6b4a2b] mb-2">Jumlah</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  className="w-10 h-10 rounded-lg border border-[#efe2c7] text-[#6b4a2b] font-bold hover:bg-[#fff6e6]"
                >
                  −
                </button>
                <span className="text-xl font-bold text-[#6b4a2b] w-12 text-center">{qty}</span>
                <button
                  onClick={() => setQty((n) => n + 1)}
                  className="w-10 h-10 rounded-lg border border-[#efe2c7] text-[#6b4a2b] font-bold hover:bg-[#fff6e6]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#6b4a2b] mb-2">Catatan (opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-[#efe2c7] p-2 text-sm focus:border-[#A0522D] focus:outline-none"
                placeholder="Contoh: tanpa gula, extra keju, dll"
              />
            </div>

            {/* Price summary */}
            <div className="mb-4 p-3 rounded-lg bg-[#FFF6E6] border border-[#e6c98a]">
              <div className="flex justify-between text-sm">
                <span className="text-[#5a4a3a]">Harga dasar</span>
                <span className="font-medium text-[#6b4a2b]">{formatRupiah(product.basePrice)}</span>
              </div>
              {variantPriceDiff !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#5a4a3a]">Varian ({selectedVariant?.name ?? defaultVariant?.name})</span>
                  <span className="font-medium text-[#6b4a2b]">{variantPriceDiff > 0 ? `+${formatRupiah(variantPriceDiff)}` : formatRupiah(variantPriceDiff)}</span>
                </div>
              )}
              {addOnsPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#5a4a3a]">Tambahan</span>
                  <span className="font-medium text-[#6b4a2b]">+{formatRupiah(addOnsPrice)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mt-1 border-t border-[#e6c98a] pt-1">
                <span className="text-[#5a4a3a]">Subtotal × {qty}</span>
                <span className="font-bold text-[#6b4a2b]">{formatRupiah(finalPrice * qty)}</span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isSoldOut}
              className="w-full rounded-lg border-0 bg-[#A0522D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8b4513] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSoldOut ? "Stok Habis" : `Tambah ke Keranjang · ${formatRupiah(finalPrice * qty)}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}