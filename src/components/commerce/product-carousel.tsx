"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductData } from "./product-card";
import {
  pendingEnrichmentKeys,
  productImageCache,
} from "@/lib/product-image-cache";
import { cn } from "@/lib/utils";

function mergeProductImages(products: ProductData[]): ProductData[] {
  return products.map((p) => ({
    ...p,
    image: p.image ?? productImageCache.get(p.id),
  }));
}

function productsSignature(products: ProductData[]): string {
  return products
    .map((p) => `${p.id}:${p.image ?? ""}:${p.price}:${p.name}`)
    .join("|");
}

function productsEqual(a: ProductData[], b: ProductData[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (p, i) =>
      p.id === b[i].id &&
      p.image === b[i].image &&
      p.name === b[i].name &&
      p.price === b[i].price &&
      p.url === b[i].url,
  );
}

export function ProductCarousel({ products }: { products: ProductData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const measureTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollStateRef = useRef({ left: false, right: false });

  const signature = useMemo(() => productsSignature(products), [products]);
  const productsRef = useRef(products);
  productsRef.current = products;

  const [displayProducts, setDisplayProducts] = useState(() =>
    mergeProductImages(products),
  );
  const [isEnriching, setIsEnriching] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const applyDisplayProducts = useCallback((next: ProductData[]) => {
    setDisplayProducts((prev) => (productsEqual(prev, next) ? prev : next));
  }, []);

  useEffect(() => {
    const currentProducts = productsRef.current;
    applyDisplayProducts(mergeProductImages(currentProducts));

    const missingIds = currentProducts
      .filter((p) => !p.image && !productImageCache.has(p.id))
      .map((p) => p.id);

    if (!missingIds.length) {
      setIsEnriching(false);
      return;
    }

    const fetchKey = missingIds.join(",");
    if (pendingEnrichmentKeys.has(fetchKey)) return;

    pendingEnrichmentKeys.add(fetchKey);
    let cancelled = false;
    setIsEnriching(true);

    fetch("/api/enrich-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: missingIds }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { images?: Record<string, string> } | null) => {
        if (cancelled || !data?.images) return;

        for (const [id, url] of Object.entries(data.images)) {
          productImageCache.set(id, url);
        }

        applyDisplayProducts(mergeProductImages(productsRef.current));
      })
      .catch(() => {})
      .finally(() => {
        pendingEnrichmentKeys.delete(fetchKey);
        if (!cancelled) setIsEnriching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applyDisplayProducts, signature]);

  const measureScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const nextLeft = el.scrollLeft > 4;
    const nextRight = maxScroll > 4 && el.scrollLeft < maxScroll - 4;

    if (
      scrollStateRef.current.left === nextLeft &&
      scrollStateRef.current.right === nextRight
    ) {
      return;
    }

    scrollStateRef.current = { left: nextLeft, right: nextRight };
    setCanScrollLeft(nextLeft);
    setCanScrollRight(nextRight);
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
    measureTimerRef.current = setTimeout(measureScrollState, 150);
  }, [measureScrollState]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    scheduleMeasure();
    el.addEventListener("scroll", scheduleMeasure, { passive: true });

    return () => {
      if (measureTimerRef.current) clearTimeout(measureTimerRef.current);
      el.removeEventListener("scroll", scheduleMeasure);
    };
  }, [signature, scheduleMeasure]);

  const handleImageReady = useCallback(() => {
    scheduleMeasure();
  }, [scheduleMeasure]);

  const scroll = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>("[data-product-card]")?.offsetWidth ?? 240;
    const gap = 12;
    const amount = (cardWidth + gap) * (direction === "left" ? -1 : 1);
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!displayProducts.length) return null;

  const hasOverflow = canScrollLeft || canScrollRight;

  return (
    <div className="full-bleed-mobile mt-4 sm:mt-5">
      <div className="content-padding mb-2.5 flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-xs sm:tracking-wider">
          Products found · {displayProducts.length}
        </p>
        {hasOverflow && (
          <div className="flex shrink-0 items-center gap-1">
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
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-linear-to-r from-background to-transparent sm:w-8"
            aria-hidden
          />
        )}
        {hasOverflow && canScrollRight && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-linear-to-l from-background to-transparent sm:w-8"
            aria-hidden
          />
        )}

        <div
          ref={trackRef}
          className={cn(
            "carousel-track flex gap-3 overflow-x-auto pb-2 pt-0.5 snap-x snap-mandatory",
            "content-padding scroll-px-[max(1rem,env(safe-area-inset-left))]",
            "sm:scroll-px-6",
          )}
        >
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              imagePending={isEnriching && !product.image}
              onImageReady={handleImageReady}
            />
          ))}
          <div className="w-2 shrink-0 snap-none" aria-hidden />
        </div>
      </div>
    </div>
  );
}