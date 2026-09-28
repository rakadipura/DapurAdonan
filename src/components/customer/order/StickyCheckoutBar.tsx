"use client";

import { useSession } from "@/components/customer/SessionProvider";
import Link from "next/link";
import { formatRupiah } from "@/lib/money";

export function StickyCheckoutBar() {
  const { state } = useSession();
  const cart = state.cart;

  if (cart.length === 0) return null;

  const totalAmount = cart.reduce((sum, item) => sum + (item.price + (item.addOnsPrice || 0)) * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-brand-border-light shadow-xl animate-slide-up-small sm:hidden">
      <div className="mx-auto max-w-screen-xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-brand-text-primary">{itemCount} item</span>
              <span className="text-brand-text-secondary">·</span>
              <span className="font-semibold text-brand-text-primary">{formatRupiah(totalAmount)}</span>
            </div>
          </div>
          <Link
            href="/menu"
            className="flex-shrink-0 w-full rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white text-center transition hover:bg-brand-primary-hover active:scale-[0.98]"
          >
            Checkout · {formatRupiah(totalAmount)}
          </Link>
        </div>
      </div>
    </div>
  );
}