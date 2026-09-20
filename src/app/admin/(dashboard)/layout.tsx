import Link from "next/link";
import type { Metadata } from "next";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata: Metadata = {
  title: "Admin — Toko Mini Moni",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fffaf0]">
      <header className="border-b border-[#efe2c7] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="font-bold text-[#6b4a2b]">Toko Mini Moni — Admin</span>
            <nav className="flex gap-4 text-sm font-medium text-[#5a4a3a] flex-wrap">
              <Link href="/admin" className="hover:text-[#A0522D]">Dashboard</Link>
              <Link href="/admin/orders" className="hover:text-[#A0522D]">Pesanan</Link>
              <Link href="/admin/bookings" className="hover:text-[#A0522D]">Booking</Link>
              <Link href="/admin/products" className="hover:text-[#A0522D]">Produk</Link>
              <Link href="/admin/categories" className="hover:text-[#A0522D]">Kategori</Link>
              <Link href="/admin/settings" className="hover:text-[#A0522D]">Pengaturan</Link>
              <Link href="/admin/slots" className="hover:text-[#A0522D]">Jadwal</Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
