interface SiteFooterProps {
  storeName: string;
  /** Use wide (max-w-6xl) layout on homepage/menu, narrow (max-w-3xl) on subpages. */
  wide?: boolean;
}

export function SiteFooter({ storeName, wide = false }: SiteFooterProps) {
  return (
    <footer className="border-t border-[#efe2c7] bg-[#fff6e6] px-4 py-8 sm:px-6">
      <div className={`mx-auto ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6b4a2b]">{storeName}</p>
            <p className="mt-1 text-xs text-[#5a4a3a]">
              Hadir setiap hari untuk kebutuhan jajanan Anda.
            </p>
            <p className="mt-1 text-xs text-[#5a4a3a]">
              Jalan Swadaya Gudang Baru No.12A Ciganjur, Jagakarsa, Jakarta Selatan
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#6b4a2b]">Jam Operasional:</p>
            <p className="mt-1 text-xs text-[#5a4a3a]">
              09.00 – 17.00 WIB (Senin - Jumat)
            </p>
            <p className="mt-1 text-xs text-[#5a4a3a]">WhatsApp: 081802003456</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
