"use client";

import { useState } from "react";
import { ProductCard } from "@/components/customer/order/ProductCard";
import { MENU_FILTERS } from "@/lib/menu-filters";
import { filterProductsByCategory } from "@/lib/menu-filters";
import type { Product, ProductVariant, AddOn } from "@/types";

interface FilterableProductGridProps {
  products: Array<Product & { variants?: ProductVariant[]; addOns?: AddOn[] }>;
}

export function FilterableProductGrid({ products }: FilterableProductGridProps) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredProducts = filterProductsByCategory(products, activeFilter);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter menu">
        {MENU_FILTERS.map((filter) => (
          <button
            key={filter.id}
            role="tab"
            aria-selected={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activeFilter === filter.id
                ? "border-[#A0522D] bg-[#A0522D] text-white"
                : "border-[#e6c98a] bg-white text-[#6b4a2b] hover:border-[#A0522D]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#e6c98a] bg-white/60 p-8 text-center text-sm text-[#5a4a3a]">
          Tidak ada produk di kategori ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}