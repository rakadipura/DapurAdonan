"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon } from "lucide-react";

/**
 * Mobile = viewport below the sm breakpoint (640px).
 * Determined in JS (matchMedia) so the correct nav renders even if a
 * stale/cached stylesheet is ever served. Defaults to desktop so SSR
 * and desktop first-paint are always the full nav.
 */
function useIsMobile(breakpointPx = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpointPx]);
  return isMobile;
}

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
 * Desktop: inline links with dividers (inline-styled so they always render).
 * Mobile: hamburger button opening a stacked menu.
 */
export function SiteHeader({ storeName, logoUrl }: SiteHeaderProps) {
  const pathname = usePathname();
  const active = activeKeyForPath(pathname);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const desktopLinkCls = (key: SiteNavKey) =>
    `whitespace-nowrap underline-offset-2 transition hover:text-[#A0522D] ${
      active === key
        ? "font-semibold text-[#A0522D] underline"
        : "hover:underline"
    }`;

  const mobileLinkCls = (key: SiteNavKey) =>
    `block border-b border-[#efe2c7] py-2.5 text-sm font-medium transition last:border-0 hover:text-[#A0522D] ${
      active === key ? "font-semibold text-[#A0522D]" : "text-[#6b4a2b]"
    }`;

  return (
    <header className="sticky top-0 z-30 bg-[#fffaf0]/95 backdrop-blur border-b border-[#efe2c7]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          {logoUrl && (
            <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
          )}
          <span className="text-xl font-semibold tracking-tight text-[#6b4a2b]">
            {storeName}
          </span>
        </Link>

        {/* Desktop nav with dividers (JS-gated: never rendered on mobile) */}
        {!isMobile && (
        <nav
          aria-label="Navigasi utama"
          className="flex flex-wrap items-center justify-end gap-y-1 text-sm font-medium text-[#6b4a2b] max-sm:hidden"
        >
          {NAV_ITEMS.map((item, index) =>
            index === 0 ? (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active === item.key ? "page" : undefined}
                className={desktopLinkCls(item.key)}
              >
                {item.label}
              </Link>
            ) : (
              <span key={item.key} className="flex items-center whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className="shrink-0"
                  style={{
                    width: 1,
                    height: 16,
                    marginLeft: 16,
                    marginRight: 16,
                    flexShrink: 0,
                    backgroundColor: "rgba(160, 82, 45, 0.55)",
                  }}
                />
                <Link
                  href={item.href}
                  aria-current={active === item.key ? "page" : undefined}
                  className={desktopLinkCls(item.key)}
                >
                  {item.label}
                </Link>
              </span>
            ),
          )}
        </nav>
        )}

        {/* Mobile hamburger (JS-gated: never rendered on desktop) */}
        {isMobile && (
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#e6c98a] bg-white text-[#6b4a2b] transition hover:border-[#A0522D] sm:hidden"
          aria-expanded={open}
          aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
        )}
      </div>

      {/* Mobile menu panel */}
      {isMobile && open && (
        <nav
          aria-label="Navigasi seluler"
          className="border-t border-[#efe2c7] bg-[#fffaf0] px-4 pb-3 pt-1 sm:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
              className={mobileLinkCls(item.key)}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
