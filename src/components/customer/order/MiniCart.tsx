"use client";

import { useSession } from "@/components/customer/SessionProvider";
import { formatRupiah } from "@/lib/money";

export function MiniCart() {
  const { state, clearCart } = useSession();
  const cart = state.cart;
  const totalAmount = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = state.cart.reduce((sum, item) => sum + item.qty, 0);

  if (cart.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[#6b4a2b]">
        {itemCount} item
      </span>
      <span className="rounded-full bg-[#A0522D] px-2 py-0.5 text-xs font-medium text-white">
        {formatRupiah(totalAmount)}
      </span>
      <button
        type="button"
        onClick={clearCart}
        className="text-xs underline underline-offset-2 text-[#A0522D] hover:text-red-600"
      >
        Hapus semua
      </button>
    </div>
  );
}
