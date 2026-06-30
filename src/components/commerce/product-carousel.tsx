"use client";

import { ChevronRight } from "lucide-react";
import { ProductCard, type ProductData } from "./product-card";

export function ProductCarousel({ products }: { products: ProductData[] }) {
  if (!products.length) return null;

  return (
    <div className="mt-3 w-full sm:mt-4">
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5 sm:px-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
          Products found · {products.length}
        </p>
        <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground sm:hidden">
          Swipe
          <ChevronRight className="size-3" />
        </p>
      </div>
      <div className="carousel-track -mx-3 flex gap-3 overflow-x-auto px-3 pb-2 pt-0.5 snap-x snap-mandatory scroll-px-3 sm:-mx-1 sm:px-1 sm:scroll-px-4">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
        <div className="w-3 shrink-0 snap-none sm:w-1" aria-hidden />
      </div>
    </div>
  );
}