"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatLKR } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import { toast } from "sonner";

export interface ProductData {
  id: string;
  name: string;
  price: number;
  image?: string;
  url?: string;
  inStock?: boolean;
}

export function ProductCard({
  product,
  imagePending = false,
}: {
  product: ProductData;
  index?: number;
  imagePending?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [product.image]);

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    toast.success(`Added ${product.name} to cart`);
  };

  return (
    <div
      data-product-card
      className="animate-fade-in flex w-[min(68vw,13.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm sm:w-56"
    >
      <div className="relative aspect-4/5 bg-muted sm:aspect-square">
        {product.image && !imageError ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 68vw, 224px"
            referrerPolicy="no-referrer"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : imagePending ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-muted/80">
            <span className="size-6 animate-pulse rounded-full bg-muted-foreground/20" />
            <span className="text-[10px] text-muted-foreground">Loading…</span>
          </div>
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</h3>
        <p className="text-sm font-semibold text-primary sm:text-base">{formatLKR(product.price)}</p>
        <div className="mt-auto flex gap-2">
          <Button size="sm" className="h-10 flex-1 text-sm sm:h-9" onClick={handleAdd}>
            <Plus className="size-3.5" />
            Add
          </Button>
          {product.url && (
            <Button size="sm" variant="outline" className="h-10 shrink-0 px-3 sm:h-9" asChild>
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}