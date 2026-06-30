"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/lib/store/cart-store";
import { useCartHydrated } from "@/lib/hooks/use-cart-hydrated";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { formatLKR, cn } from "@/lib/utils";

interface CartPanelProps {
  onCheckout?: () => void;
  triggerClassName?: string;
}

export function CartPanel({ onCheckout, triggerClassName }: CartPanelProps) {
  const isMobile = useIsMobile();
  const cartHydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);
  const count = cartHydrated ? itemCount() : 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "relative flex size-9 items-center justify-center rounded-full border border-border/60 bg-card/80 text-sm font-medium backdrop-blur-sm transition hover:bg-card sm:size-auto sm:gap-2 sm:px-4 sm:py-2",
            triggerClassName
          )}
          aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
          suppressHydrationWarning
        >
          <ShoppingBag className="size-4" />
          <span className="hidden sm:inline">Cart</span>
          {count > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground sm:static sm:size-5">
              {count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side={isMobile ? "bottom" : "right"}>
        <div className="flex h-full flex-col">
          <h2 className="font-display text-xl font-semibold">Your Cart</h2>
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? "Empty — let's find something special!" : `${itemCount()} items`}
          </p>

          <div className="mt-4 flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                <ShoppingBag className="size-12 opacity-30" />
                <p className="text-sm">Ask Saama to find gifts for any occasion</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-3 rounded-xl border border-border/50 p-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                      <p className="text-sm font-semibold text-primary">{formatLKR(item.price)}</p>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="touch-target flex items-center justify-center rounded-full border p-1 hover:bg-muted"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="touch-target flex items-center justify-center rounded-full border p-1 hover:bg-muted"
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="touch-target ml-auto flex items-center justify-center rounded-full p-1.5 text-destructive hover:bg-destructive/10"
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="mb-4 flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatLKR(total())}</span>
              </div>
              <Button className="w-full" size="lg" onClick={onCheckout}>
                Proceed to Checkout
              </Button>
              <Button variant="ghost" className="mt-2 w-full" onClick={clearCart}>
                Clear cart
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}