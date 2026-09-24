import type { Metadata } from "next";
import Link from "next/link";
import { OrderHistory } from "@/components/customer/order/OrderHistory";

export const metadata: Metadata = {
  title: "Riwayat Pesanan — Toko Mini Moni",
};

export const dynamic = "force-dynamic";

export default function AccountOrdersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
        ← Kembali ke Beranda
      </Link>
      <h1 className="text-2xl font-bold text-[#6b4a2b]">Riwayat Pesanan</h1>
      <p className="mt-1 mb-6 text-sm text-[#5a4a3a]">
        Masukkan nomor telepon untuk melihat semua riwayat pesanan Anda.
      </p>
      <OrderHistory showHeader={false} />
    </div>
  );
}
