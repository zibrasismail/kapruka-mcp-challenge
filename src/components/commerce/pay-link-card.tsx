"use client";

import { ExternalLink, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PayLinkCard({ text }: { text: string }) {
  const urlMatch = text.match(/(https?:\/\/[^\s)]+(?:pay|checkout|order)[^\s)]*)/i)
    ?? text.match(/(https?:\/\/[^\s)]+kapruka[^\s)]*)/i);
  const orderMatch = text.match(/order[#\s:]+([A-Z0-9-]+)/i);

  if (!urlMatch) return null;

  return (
    <div className="animate-fade-in my-3 rounded-2xl border-2 border-primary/30 bg-linear-to-br from-primary/5 to-amber-500/5 p-4 sm:p-5">
      <div className="flex items-center gap-2.5 text-primary">
        <CreditCard className="size-5 shrink-0" />
        <h3 className="font-display text-base font-semibold leading-tight sm:text-lg">Order Ready!</h3>
      </div>
      {orderMatch && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          Order #{orderMatch[1]}
        </p>
      )}
      <p className="mt-2 text-sm leading-relaxed">
        Your prices are locked for 60 minutes. Click below to complete payment on Kapruka.
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-xs leading-relaxed text-muted-foreground">
        <Clock className="size-3.5" />
        Pay link expires in 60 minutes
      </div>
      <Button className="mt-4 w-full" size="lg" asChild>
        <a href={urlMatch[1]} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4" />
          Pay Now on Kapruka
        </a>
      </Button>
    </div>
  );
}