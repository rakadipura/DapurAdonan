/**
 * Format an integer rupiah amount as Indonesian currency string,
 * e.g. 25000 => "Rp25.000" and 150000 => "Rp150.000".
 * Uses fixed locale to avoid hydration mismatch.
 */
export function formatRupiah(amount: number): string {
  // Fixed formatting to avoid SSR/client locale differences
  return "Rp" + amount.toLocaleString("id-ID");
}

/**
 * Convert a value that may be a number or a string with currency formatting
 * into an integer rupiah amount. Used when reading settings that store
 * amounts as formatted strings.
 */
export function toRupiahInt(value: number | string): number {
  if (typeof value === "number") return Math.round(value);
  const raw = value.replace(/Rp/g, "").replace(/\./g, "").replace(/Rp/g, "").trim();
  const parsed = Number(raw.replace(/,/g, "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}
