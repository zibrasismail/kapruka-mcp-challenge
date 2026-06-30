"use client";

import { motion } from "framer-motion";
import { ExternalLink, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PayLinkCard({ text }: { text: string }) {
  const urlMatch = text.match(/(https?:\/\/[^\s)]+(?:pay|checkout|order)[^\s)]*)/i)
    ?? text.match(/(https?:\/\/[^\s)]+kapruka[^\s)]*)/i);
  const orderMatch = text.match(/order[#\s:]+([A-Z0-9-]+)/i);

  if (!urlMatch) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="my-3 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-amber-500/5 p-5"
    >
      <div className="flex items-center gap-2 text-primary">
        <CreditCard className="size-5" />
        <h3 className="font-display text-lg font-semibold">Order Ready!</h3>
      </div>
      {orderMatch && (
        <p className="mt-1 text-sm text-muted-foreground">
          Order #{orderMatch[1]}
        </p>
      )}
      <p className="mt-2 text-sm">
        Your prices are locked for 60 minutes. Click below to complete payment on Kapruka.
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" />
        Pay link expires in 60 minutes
      </div>
      <Button className="mt-4 w-full" size="lg" asChild>
        <a href={urlMatch[1]} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4" />
          Pay Now on Kapruka
        </a>
      </Button>
    </motion.div>
  );
}