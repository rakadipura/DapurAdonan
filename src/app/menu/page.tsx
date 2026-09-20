import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCustomerFacingSettings } from "@/lib/settings";
import { SessionProvider } from "@/components/customer/SessionProvider";
import { OrderForm } from "@/components/customer/order/OrderForm";
import { ProductCard } from "@/components/customer/order/ProductCard";
import type { Product, ProductVariant, AddOn } from "@/types";

export const metadata: Metadata = {
  title: "Toko Mini Moni — Roti, Kue, dan Jajanan Sehat",
  description:
    "Toko Mini Moni menyediakan roti tawar, kue kering, ronde kue, dan minuman segar. Pesan untuk diambil atau dikirim.",
};

export default async function MenuPage() {
  const [categories, products, settings, todayOrders] = await Promise.all([
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        dailyStock: true,
        isAvailable: true,
        leadTimeDays: true,
        isCustomCake: true,
        allergens: true,
        tags: true,
        category: { select: { name: true, slug: true } },
        variants: { select: { id: true, name: true, priceDiff: true, isDefault: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
        addOns: { select: { id: true, name: true, price: true, isRequired: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
    getCustomerFacingSettings(),
    prisma.order.findMany({
      where: {
        status: { in: ["CONFIRMED", "BAKING", "READY", "COMPLETED"] },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: {
        itemsOrder: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const featuredProducts = products.slice(0, 4);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#fffaf0]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#fffaf0]/95 backdrop-blur border-b border-[#efe2c7]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight text-[#6b4a2b]">
                Toko Mini Moni
              </span>
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-[#6b4a2b]">
              <Link href="/menu" className="hover:text-[#A0522D] underline underline-offset-2">
                Menu
              </Link>
              <Link href="/booking" className="hover:text-[#A0522D] underline underline-offset-2">
                Booking
              </Link>
              <Link href="/#kontak" className="hover:text-[#A0522D] underline underline-offset-2">
                Kontak
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="relative bg-[#FDF6E3] overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-20">
            <div className="max-w-2xl">
              <span className="mb-2 inline-block rounded-full border border-[#e6c98a] bg-[#fff] px-3 py-0.5 text-xs font-medium text-[#A0522D] uppercase tracking-wider">
                Selamat datang
              </span>
              <h1 className="mb-4 text-3xl font-bold leading-tight text-[#6b4a2b] sm:text-5xl">
                Jajanan Kue, Roti, dan Minuman
                <br />
                <span className="text-[#A0522D]">Kualitas Handmade</span>
              </h1>
              <p className="mb-8 text-base leading-relaxed text-[#5a4a3a]">
                Toko Mini Moni hadir dengan rangkaian kue kering, ronde kue, roti, dan minuman segar yang dibuat dengan bahan pilihan. Pesan untuk diambil atau siap antar.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/menu" className="inline-flex items-center justify-center rounded-xl border-0 bg-[#A0522D] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8b4513]">
                  Lihat Menu
                </a>
                <a href="/booking" className="inline-flex items-center justify-center rounded-xl border border-[#e6c98a] bg-white px-6 py-3 text-sm font-semibold text-[#6b4a2b] shadow-sm transition hover:border-[#A0522D]">
                  Booking Meja
                </a>
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#FCE9C8] blur-3xl opacity-60" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-[#FCE9C8] blur-3xl opacity-50" />
        </section>

        {/* Featured products */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#6b4a2b]">
              Pilihan Khas
            </h2>
            <a href="/menu#produk" className="text-sm font-medium text-[#A0522D] underline underline-offset-2">
              Lihat semua
            </a>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product: Product & { variants?: ProductVariant[]; addOns?: AddOn[] }) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Catalog */}
        <section id="produk" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#6b4a2b]">Menu Lengkap</h2>
            <p className="mt-1 text-sm text-[#5a4a3a]">
              Pilih produk, atur jumlah, dan checkout. Pesanan bisa untuk diambil atau dikirim.
            </p>
          </div>

          {/* Categories tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            <a
              href="#"
              className="rounded-full border border-[#e6c98a] bg-white px-4 py-1.5 text-sm font-medium text-[#6b4a2b] transition hover:border-[#A0522D]"
            >
              Semua
            </a>
            {categories.map((cat: { id: number; name: string; slug: string }) => (
              <a
                key={cat.id}
                href={`/menu?category=${cat.slug}`}
                className="rounded-full border border-[#e6c98a] bg-white px-4 py-1.5 text-sm font-medium text-[#6b4a2b] transition hover:border-[#A0522D]"
              >
                {cat.name}
              </a>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
              Belum ada produk. Hubungi admin untuk menambahkan menu.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product: Product & { variants?: ProductVariant[]; addOns?: AddOn[] }) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Order form */}
        <section className="bg-[#fffaf0] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
          <div className="mx-auto max-w-3xl">
            <OrderForm
              products={products}
              categories={categories}
              settings={settings}
              featuredOrders={todayOrders.map((o: { code: string; customerName: string; total: number; status: string }) => ({
                code: o.code,
                customerName: o.customerName,
                total: o.total,
                status: o.status,
              }))}
            />
          </div>
        </section>

        {/* Footer */}
        <footer id="kontak" className="border-t border-[#efe2c7] bg-[#fff6e6] px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#6b4a2b]">Toko Mini Moni</p>
                <p className="mt-1 text-xs text-[#5a4a3a]">
                  Hadir setiap hari untuk kebutuhan jajanan Anda.
                </p>
              </div>
              <div className="text-sm text-[#5a4a3a]">
                <p className="mb-1">Jam operasional: 09.00 – 17.00 WIB</p>
                <p className="text-xs">WhatsApp: 0812-3456-7890</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
</SessionProvider>
  );
}
