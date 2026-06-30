"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OccasionChips } from "./occasion-chips";
import { ProductCarousel } from "@/components/commerce/product-carousel";
import { CartPanel } from "@/components/commerce/cart-panel";
import { PayLinkCard } from "@/components/commerce/pay-link-card";
import { parseProductsFromToolResult } from "@/lib/parse-products";
import {
  getMessageText,
  getToolParts,
  getActiveToolLoads,
} from "@/lib/chat-utils";
import { MarkdownMessage } from "./markdown-message";
import { useCartStore } from "@/lib/store/cart-store";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const WELCOME = {
  title: "Ayubowan! I'm Saama",
  subtitle: "Your trilingual gift concierge for Kapruka",
  sinhala: "සමා — ශ්‍රී ලංකාවේ තෑගි සොයාගැනීමේ AI සහායක",
};

export function ChatInterface() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const cartItems = useCartStore((s) => s.items);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => console.error("[chat]", err),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    setInput("");
    await sendMessage({ text: msg });
  };

  const handleCheckout = () => {
    const cartSummary = cartItems
      .map((i) => `- ${i.name} (ID: ${i.productId}) x${i.quantity} @ LKR ${i.price}`)
      .join("\n");
    handleSubmit(
      `I'm ready to checkout. Here's my cart:\n${cartSummary}\n\nPlease help me complete the order with delivery details.`
    );
  };

  const toolProducts = useMemo(() => {
    const products: ReturnType<typeof parseProductsFromToolResult> = [];
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      for (const inv of getToolParts(msg)) {
        if (
          inv.state === "output-available" &&
          (inv.toolName === "search_products" || inv.toolName === "get_product") &&
          typeof inv.output === "string"
        ) {
          products.push(...parseProductsFromToolResult(inv.output));
        }
      }
    }
    const seen = new Set<string>();
    return products.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [messages]);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-border/50 bg-card/70 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold leading-tight">
              Kapruka <span className="text-primary">Saama</span>
            </h1>
            <p className="text-[11px] text-muted-foreground">සමා · Gift Concierge</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-700 sm:inline dark:text-emerald-400">
            Live Kapruka
          </span>
          <ThemeToggle />
          <CartPanel onCheckout={handleCheckout} />
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {WELCOME.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{WELCOME.subtitle}</p>
              <p className="mt-1 font-sinhala text-sm text-primary/80">{WELCOME.sinhala}</p>
              <div className="mt-6 flex justify-center">
                <OccasionChips onSelect={handleSubmit} />
              </div>
            </motion.div>
          )}

          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "max-w-[85%] bg-primary text-primary-foreground rounded-br-md"
                      : "max-w-[min(100%,42rem)] bg-card border border-border/50 rounded-bl-md shadow-sm"
                  )}
                >
                  {msg.role === "assistant" && (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Saama
                    </p>
                  )}
                  {msg.role === "assistant" ? (
                    <MarkdownMessage content={getMessageText(msg)} />
                  ) : (
                    <div className="whitespace-pre-wrap">{getMessageText(msg)}</div>
                  )}

                  {getActiveToolLoads(msg).map((inv) => (
                    <ToolStatusCard
                      key={inv.toolCallId}
                      toolName={inv.toolName}
                      variant="loading"
                    />
                  ))}

                  {getToolParts(msg).map((inv) => {
                    if (inv.state === "output-error") {
                      return (
                        <ToolStatusCard
                          key={inv.toolCallId}
                          toolName={inv.toolName}
                          variant="error"
                          detail={inv.errorText}
                        />
                      );
                    }
                    if (
                      inv.state === "output-available" &&
                      inv.toolName === "create_order" &&
                      typeof inv.output === "string"
                    ) {
                      return <PayLinkCard key={inv.toolCallId} text={inv.output} />;
                    }
                    return null;
                  })}
                </div>
              </motion.div>
            ))}

            {isLoading &&
              messages[messages.length - 1]?.role === "user" &&
              !messages.some(
                (m) => m.role === "assistant" && getActiveToolLoads(m).length > 0
              ) && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    Saama is thinking...
                  </div>
                </div>
              )}
          </div>

          <AnimatePresence>
            {toolProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <ProductCarousel products={toolProducts} />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error.message || "Something went wrong. Please try again."}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border/50 bg-card/70 px-4 py-3 backdrop-blur-xl sm:px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type in Sinhala, English, or Tanglish..."
            rows={1}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-2xl"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground">
          Powered by Kapruka MCP · Real products · Real checkout
        </p>
      </div>
    </div>
  );
}

function toolLabel(name: string): string {
  const labels: Record<string, string> = {
    search_products: "Searching Kapruka",
    get_product: "Loading product details",
    list_categories: "Browsing categories",
    list_delivery_cities: "Finding delivery cities",
    check_delivery: "Checking delivery",
    create_order: "Creating your order",
    track_order: "Tracking order",
  };
  return labels[name] ?? "Working";
}

function toolHint(name: string): string {
  const hints: Record<string, string> = {
    search_products: "Browsing the live catalog — usually takes 10–20 seconds",
    get_product: "Fetching product details from Kapruka",
    list_categories: "Loading gift categories",
    list_delivery_cities: "Looking up delivery cities",
    check_delivery: "Checking delivery availability",
    create_order: "Preparing your checkout link",
    track_order: "Fetching order status",
  };
  return hints[name] ?? "Please wait a moment";
}

function ToolStatusCard({
  toolName,
  variant,
  detail,
}: {
  toolName: string;
  variant: "loading" | "error";
  detail?: string;
}) {
  if (variant === "error") {
    return (
      <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
        {toolLabel(toolName)} failed
        {detail ? ` — ${detail}` : ""}. Please try again.
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
      <div>
        <p className="text-sm font-medium text-foreground">
          {toolLabel(toolName)}...
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {toolHint(toolName)}
        </p>
      </div>
    </div>
  );
}