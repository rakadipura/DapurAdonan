"use client";

import { useState } from "react";
import Image from "next/image";
import { formatRupiah } from "@/lib/money";
import { useSession } from "@/components/customer/SessionProvider";
import { toast } from "sonner";
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
      toast.error(`Pilih add-on wajib: ${missingRequired.map((a) => a.name).join(", ")}`);
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
      <div className="group rounded-xl border border-brand-border-light bg-white p-4 shadow-sm hover-lift max-sm:p-3">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-bg-card">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="100vw"
              placeholder="blur"
              blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23FCE9C8' width='400' height='400'/%3E%3C/svg%3E"
              onError={(e) => {
                e.currentTarget.src = "/images/products/placeholder.svg";
              }}
            />
          ) : (
            <Image
              src="/images/products/placeholder.svg"
              alt={product.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs text-brand-text-accent uppercase tracking-wider">{product.category?.name}</p>
          <h3 className="mt-0.5 text-base font-semibold text-brand-text-primary max-sm:text-sm">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-brand-text-secondary max-sm:text-xs">{product.description}</p>
          {product.leadTimeDays > 0 && (
            <p className="mt-1 text-xs text-brand-text-accent font-medium">Pesan minimal {product.leadTimeDays} hari sebelumnya</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-brand-text-primary max-sm:text-base">Mulai {formatRupiah(product.basePrice)}</span>
            {stockLabel && (
              <span className={`text-xs font-medium ${isSoldOut ? "text-red-600" : "text-brand-text-accent"}`}>{stockLabel}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            disabled={isSoldOut}
            className="mt-3 w-full rounded-lg border-0 bg-brand-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover active-scale disabled:opacity-50 disabled:cursor-not-allowed max-sm:px-2 max-sm:py-1.5 max-sm:text-xs"
          >
            Pesan Custom
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="group rounded-xl border border-brand-border-light bg-white shadow-sm hover-lift flex flex-col h-full">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-bg-card">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="100vw"
              placeholder="blur"
              blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23FCE9C8' width='400' height='400'/%3E%3C/svg%3E"
              onError={(e) => {
                e.currentTarget.src = "/images/products/placeholder.svg";
              }}
            />
          ) : (
            <Image
              src="/images/products/placeholder.svg"
              alt={product.name}
              fill
              className="object-cover"
              sizes="100vw"
            />
          )}
        </div>
        <div className="p-4 flex flex-col flex-1 max-sm:p-3">
          <p className="text-xs text-brand-text-accent uppercase tracking-wider">{product.category?.name}</p>
          <h3 className="mt-0.5 text-base font-semibold text-brand-text-primary max-sm:text-sm">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-brand-text-secondary max-sm:text-xs">{product.description}</p>
          {product.allergens.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {product.allergens.map((a) => (
                <span key={a} className="text-xs px-2 py-0.5 rounded bg-brand-badge-bg text-brand-text-accent border border-brand-badge-border">{a}</span>
              ))}
            </div>
          )}
          {product.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {product.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded bg-brand-bg-card text-brand-text-accent">{t}</span>
              ))}
            </div>
          )}
          <div className="mt-auto pt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-brand-text-primary max-sm:text-base">{formatRupiah(finalPrice)}</span>
            {stockLabel && (
              <span className={`text-xs font-medium ${isSoldOut ? "text-red-600" : "text-brand-text-accent"}`}>{stockLabel}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowOptions(true)}
            disabled={isSoldOut}
            className="mt-3 w-full rounded-lg border-0 bg-brand-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover active-scale disabled:opacity-50 disabled:cursor-not-allowed max-sm:px-2 max-sm:py-1.5 max-sm:text-xs"
          >
            Tambah ke Keranjang
          </button>
        </div>
      </div>

      {/* Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setShowOptions(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-brand-text-primary">{product.name}</h3>
              <button onClick={() => setShowOptions(false)} className="text-brand-text-secondary hover:text-brand-text-primary transition-colors active-scale">✕</button>
            </div>

            {/* Variant selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text-primary mb-2">Ukuran / Varian</label>
                <div className="grid gap-2">
                  {product.variants.map((v) => (
                    <label
                      key={v.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition active-scale ${
                        (selectedVariant?.id ?? defaultVariant?.id) === v.id
                          ? "border-brand-primary bg-brand-bg-highlight"
                          : "border-brand-border-light hover:border-brand-primary"
                      }`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      <span className="font-medium text-brand-text-primary">{v.name}</span>
                      <span className="text-sm text-brand-text-secondary">
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
                <label className="block text-sm font-medium text-brand-text-primary mb-2">Tambahan</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {product.addOns.map((a) => (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition active-scale ${
                        selectedAddOns.has(a.id)
                          ? "border-brand-primary bg-brand-bg-highlight"
                          : "border-brand-border-light hover:border-brand-primary"
                      }`}
                      onClick={() => toggleAddOn(a.id)}
                    >
                      <div>
                        <span className="font-medium text-brand-text-primary">{a.name}</span>
                        {a.isRequired && <span className="ml-1 text-xs text-red-600">(wajib)</span>}
                      </div>
                      <span className="text-sm text-brand-text-secondary">{formatRupiah(a.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text-primary mb-2">Jumlah</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  className="w-10 h-10 rounded-lg border border-brand-border-light text-brand-text-primary font-bold hover:bg-brand-badge-bg active-scale"
                >
                  −
                </button>
                <span className="text-xl font-bold text-brand-text-primary w-12 text-center">{qty}</span>
                <button
                  onClick={() => setQty((n) => n + 1)}
                  className="w-10 h-10 rounded-lg border border-brand-border-light text-brand-text-primary font-bold hover:bg-brand-badge-bg active-scale"
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
                className="w-full rounded-lg border border-brand-border-light p-2 text-sm focus-ring-sm"
                placeholder="Contoh: tanpa gula, extra keju, dll"
              />
            </div>

            {/* Price summary */}
            <div className="mb-4 p-3 rounded-lg bg-brand-bg-highlight border border-brand-border-primary">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-secondary">Harga dasar</span>
                <span className="font-medium text-brand-text-primary">{formatRupiah(product.basePrice)}</span>
              </div>
              {variantPriceDiff !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-secondary">Varian ({selectedVariant?.name ?? defaultVariant?.name})</span>
                  <span className="font-medium text-brand-text-primary">{variantPriceDiff > 0 ? `+${formatRupiah(variantPriceDiff)}` : formatRupiah(variantPriceDiff)}</span>
                </div>
              )}
              {addOnsPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-text-secondary">Tambahan</span>
                  <span className="font-medium text-brand-text-primary">+{formatRupiah(addOnsPrice)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mt-1 border-t border-brand-border-primary pt-1">
                <span className="text-brand-text-secondary">Subtotal × {qty}</span>
                <span className="font-bold text-brand-text-primary">{formatRupiah(finalPrice * qty)}</span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isSoldOut}
              className="w-full rounded-lg border-0 bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-hover active-scale disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSoldOut ? "Stok Habis" : `Tambah ke Keranjang · ${formatRupiah(finalPrice * qty)}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}