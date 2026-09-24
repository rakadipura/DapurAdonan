export interface MenuFilter {
  id: string;
  label: string;
  categorySlugs: string[];
}

export const MENU_FILTERS: MenuFilter[] = [
  { id: "all", label: "Semua", categorySlugs: [] },
  { id: "kue", label: "Kue", categorySlugs: ["ronde-kue", "kue-kering", "kue-lempeng", "kue-custom"] },
  { id: "roti", label: "Roti", categorySlugs: ["roti"] },
  { id: "minuman", label: "Minuman", categorySlugs: ["minuman"] },
];

export function getFilterById(id: string): MenuFilter | undefined {
  return MENU_FILTERS.find((f) => f.id === id);
}

export function filterProductsByCategory<T extends { category?: { slug: string } }>(
  products: T[],
  filterId: string
): T[] {
  const filter = getFilterById(filterId);
  if (!filter || filter.id === "all") return products;

  return products.filter((p) => p.category && filter.categorySlugs.includes(p.category.slug));
}