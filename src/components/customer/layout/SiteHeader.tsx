"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SiteNavKey = "beranda" | "booking" | "status" | "riwayat" | "kontak";

const NAV_ITEMS: Array<{ key: SiteNavKey; label: string; href: string }> = [
  { key: "beranda", label: "Beranda", href: "/" },
  { key: "booking", label: "Booking", href: "/booking" },
  { key: "status", label: "Status Pesanan", href: "/status" },
  { key: "riwayat", label: "Riwayat Pesanan", href: "/riwayat" },
  { key: "kontak", label: "Kontak", href: "/kontak" },
];

function activeKeyForPath(pathname: string): SiteNavKey | undefined {
  if (pathname === "/") return "beranda";
  if (pathname === "/menu" || pathname.startsWith("/menu/")) return "beranda";
  if (pathname.startsWith("/booking")) return "booking";
  if (pathname === "/status" || pathname.startsWith("/order")) return "status";
  if (pathname === "/riwayat" || pathname.startsWith("/account")) return "riwayat";
  if (pathname.startsWith("/kontak")) return "kontak";
  return undefined;
}

interface SiteHeaderProps {
  storeName: string;
  logoUrl?: string | null;
}

/**
 * Single shared top navigation, rendered once from the (site) layout.
 * The divider uses an inline style (not a Tailwind class) so it can never
 * be dropped by the CSS compiler — it always renders.
 */
export function SiteHeader({ storeName, logoUrl }: SiteHeaderProps) {
  const pathname = usePathname();
  const active = activeKeyForPath(pathname);

  return (
    <header className="sticky top-0 z-30 bg-[#fffaf0]/95 backdrop-blur border-b border-[#efe2c7]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {logoUrl && (
            <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
          )}
          <span className="text-xl font-semibold tracking-tight text-[#6b4a2b]">
            {storeName}
          </span>
        </Link>
        <nav
          aria-label="Navigasi utama"
          className="flex flex-wrap items-center justify-end gap-y-1 text-sm font-medium text-[#6b4a2b]"
        >
          {NAV_ITEMS.map((item, index) =>
            index === 0 ? (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active === item.key ? "page" : undefined}
                className={`whitespace-nowrap underline-offset-2 transition hover:text-[#A0522D] ${
                  active === item.key
                    ? "font-semibold text-[#A0522D] underline"
                    : "hover:underline"
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span key={item.key} className="flex items-center whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className="mx-4 shrink-0"
                  style={{ width: 1, height: 16, backgroundColor: "rgba(160, 82, 45, 0.55)" }}
                />
                <Link
                  href={item.href}
                  aria-current={active === item.key ? "page" : undefined}
                  className={`whitespace-nowrap underline-offset-2 transition hover:text-[#A0522D] ${
                    active === item.key
                      ? "font-semibold text-[#A0522D] underline"
                      : "hover:underline"
                  }`}
                >
                  {item.label}
                </Link>
              </span>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
