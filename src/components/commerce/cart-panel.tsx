"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/lib/store/cart-store";
import { formatLKR, cn } from "@/lib/utils";

interface CartPanelProps {
  onCheckout?: () => void;
  triggerClassName?: string;
}

export function CartPanel({ onCheckout, triggerClassName }: CartPanelProps) {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className={cn(
            "relative flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-card",
            triggerClassName
          )}
        >
          <ShoppingBag className="size-4" />
          <span className="hidden sm:inline">Cart</span>
          {itemCount() > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {itemCount()}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent>
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
                          className="rounded-full border p-1 hover:bg-muted"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="rounded-full border p-1 hover:bg-muted"
                        >
                          <Plus className="size-3" />
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto rounded-full p-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
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