"use client";

import { ProductCard, type ProductData } from "./product-card";

export function ProductCarousel({ products }: { products: ProductData[] }) {
  if (!products.length) return null;

  return (
    <div className="my-3 -mx-1">
      <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Products found
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-thin">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
    </div>
  );
}