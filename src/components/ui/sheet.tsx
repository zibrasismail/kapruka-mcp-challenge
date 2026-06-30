"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "right" | "left" | "bottom";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-card shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out",
          side === "right" &&
            "inset-y-0 right-0 h-full w-full max-w-md border-l border-border p-6 safe-top safe-bottom",
          side === "left" &&
            "inset-y-0 left-0 h-full w-full max-w-md border-r border-border p-6 safe-top safe-bottom",
          side === "bottom" &&
            "inset-x-0 bottom-0 top-auto max-h-[min(88dvh,100%)] w-full rounded-t-2xl border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 sm:p-6",
          className
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">Panel</DialogPrimitive.Title>
        {side === "bottom" && (
          <div className="mx-auto -mt-1 mb-1 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
        )}
        {children}
        <DialogPrimitive.Close
          className={cn(
            "absolute rounded-full p-1.5 opacity-70 transition hover:opacity-100",
            side === "bottom" ? "top-3 right-3" : "top-4 right-4"
          )}
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}