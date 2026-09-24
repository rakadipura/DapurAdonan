import type { Metadata } from "next";
import Link from "next/link";
import { getCustomerFacingSettings } from "@/lib/settings";
import { SessionProvider } from "@/components/customer/SessionProvider";
import { SiteHeader } from "@/components/customer/layout/SiteHeader";
import { SiteFooter } from "@/components/customer/layout/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kontak — Toko Mini Moni",
  description: "Hubungi Toko Mini Moni: jam operasional, WhatsApp, dan lokasi.",
};

export default async function KontakPage() {
  const settings = await getCustomerFacingSettings();
  const waDisplay = "081802003456";
  const waNumberIntl = "6281802003456";
  const waLink = `https://wa.me/${waNumberIntl}?text=${encodeURIComponent(`Halo ${settings.storeName}, saya ingin bertanya.`)}`;

  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#fffaf0]">
        <SiteHeader storeName={settings.storeName} logoUrl={settings.logoUrl} active="kontak" />

        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#A0522D] underline underline-offset-2">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-2xl font-bold text-[#6b4a2b]">Kontak</h1>
          <p className="mt-1 mb-6 text-sm text-[#5a4a3a]">
            Hubungi kami untuk pemesanan, pertanyaan, atau kerja sama.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#efe2c7] bg-white p-6">
              <p className="text-sm font-semibold text-[#6b4a2b]">Jam Operasional</p>
              <p className="mt-1 text-sm text-[#5a4a3a]">09.00 – 17.00 WIB</p>
              <p className="text-xs text-[#5a4a3a]">Senin - Jumat</p>
            </div>
            <div className="rounded-xl border border-[#efe2c7] bg-white p-6">
              <p className="text-sm font-semibold text-[#6b4a2b]">WhatsApp</p>
              <p className="mt-1 text-sm text-[#5a4a3a]">{waDisplay}</p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center rounded-lg border-0 bg-[#A0522D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8b4513]"
              >
                Chat via WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#efe2c7] bg-white p-6">
            <p className="text-sm font-semibold text-[#6b4a2b]">{settings.storeName}</p>
            <p className="mt-1 text-sm text-[#5a4a3a]">
              Hadir setiap hari untuk kebutuhan jajanan Anda.
            </p>
            <p className="mt-2 text-sm text-[#5a4a3a]">
              Jalan Swadaya Gudang Baru No.12A Ciganjur, Jagakarsa, Jakarta Selatan
            </p>
          </div>
        </main>

        {/* Footer */}
        <SiteFooter storeName={settings.storeName} />
      </div>
    </SessionProvider>
  );
}
