"use client";

import { useSession } from "@/components/customer/SessionProvider";
import Link from "next/link";
import { ShoppingCartIcon, XIcon } from "lucide-react";
import { formatRupiah } from "@/lib/money";
import { useState, useEffect } from "react";

export function FloatingCartFAB() {
  const { state, clearCart } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const cart = state.cart;
  const totalAmount = state.cart.reduce((sum, item) => sum + (item.price + (item.addOnsPrice || 0)) * item.qty, 0);
  const itemCount = state.cart.reduce((sum, item) => sum + item.qty, 0);

  if (cart.length === 0) return null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".floating-cart-container")) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="floating-cart-container fixed bottom-6 right-4 z-40 sm:hidden">
      {/* FAB Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg transition hover:bg-brand-primary-hover active:scale-[0.95] focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        aria-label={isOpen ? "Tutup keranjang" : "Buka keranjang"}
        aria-expanded={isOpen}
      >
        {isOpen ? <XIcon className="h-7 w-7" /> : <ShoppingCartIcon className="h-7 w-7" />}
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 max-w-[calc(100vw-1rem)] bg-white rounded-xl border border-brand-border-light shadow-xl overflow-hidden animate-slide-up-small">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border-light bg-brand-bg-highlight">
            <span className="font-semibold text-brand-text-primary">Keranjang ({itemCount})</span>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-brand-text-accent hover:text-red-600"
            >
              Hapus semua
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto p-3 space-y-3">
            {cart.map((item) => {
              const lineTotal = (item.price + (item.addOnsPrice || 0)) * item.qty;
              return (
                <div key={`${item.productId}-${item.variantId ?? "none"}-${item.selectedAddOns?.join(",") ?? ""}`} className="flex gap-3">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href="/menu" className="font-medium text-brand-text-primary truncate block">
                      {item.name}
                    </Link>
                    {item.variantId && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-brand-bg-card text-brand-text-accent">
                        {item.variantId}
                      </span>
                    )}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <span className="text-xs text-brand-text-secondary">
                        +{item.selectedAddOns.length} tambahan
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-semibold text-brand-text-primary">
                        {formatRupiah(lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-brand-border-light p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-secondary">Subtotal</span>
              <span className="font-semibold text-brand-text-primary">{formatRupiah(totalAmount)}</span>
            </div>
            <Link
              href="/menu"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover active:scale-[0.98]"
            >
              Lanjut ke Checkout · {formatRupiah(totalAmount)}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}