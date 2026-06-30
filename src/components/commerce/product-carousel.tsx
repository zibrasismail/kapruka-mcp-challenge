"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductData } from "./product-card";
import { cn } from "@/lib/utils";

export function ProductCarousel({ products }: { products: ProductData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [products, updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>("[data-product-card]")?.offsetWidth ?? 240;
    const gap = 12;
    const amount = (cardWidth + gap) * (direction === "left" ? -1 : 1);
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!products.length) return null;

  const hasOverflow = canScrollLeft || canScrollRight;

  return (
    <div className="-mx-3 mt-3 w-[calc(100%+1.5rem)] sm:mx-0 sm:mt-4 sm:w-full">
      <div className="mb-2 flex items-center justify-between gap-2 px-3 sm:px-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
          Products found · {products.length}
        </p>
        {hasOverflow && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 shrink-0 sm:size-8"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous products"
            >
              <ChevronLeft className="size-3.5 sm:size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-7 shrink-0 sm:size-8"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Next products"
            >
              <ChevronRight className="size-3.5 sm:size-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="relative">
        {hasOverflow && canScrollLeft && (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent sm:w-8"
            aria-hidden
          />
        )}
        {hasOverflow && canScrollRight && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent sm:w-8"
            aria-hidden
          />
        )}

        <div
          ref={trackRef}
          className={cn(
            "carousel-track flex gap-3 overflow-x-auto pb-2 pt-0.5 snap-x snap-mandatory",
            "px-3 scroll-px-3 sm:px-1 sm:scroll-px-4"
          )}
        >
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
          <div className="w-2 shrink-0 snap-none" aria-hidden />
        </div>
      </div>
    </div>
  );
}