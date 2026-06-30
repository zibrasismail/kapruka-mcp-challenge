"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OccasionChips } from "./occasion-chips";
import { useKeyboardOffset } from "@/lib/hooks/use-visual-viewport";
import { ProductCarousel } from "@/components/commerce/product-carousel";
import { CartPanel } from "@/components/commerce/cart-panel";
import { PayLinkCard } from "@/components/commerce/pay-link-card";
import { parseProductsFromToolResult } from "@/lib/parse-products";
import {
  getMessageText,
  getDisplayMessageText,
  getToolParts,
  getActiveToolLoads,
  isAssistantTurnInProgress,
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const keyboardOffset = useKeyboardOffset();
  const cartItems = useCartStore((s) => s.items);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => console.error("[chat]", err),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (keyboardOffset > 0) {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight });
    }
  }, [keyboardOffset]);

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
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
      <header className="safe-top content-padding z-10 flex shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-card/70 py-3 backdrop-blur-xl sm:py-3.5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md sm:size-10 sm:rounded-2xl">
            <Sparkles className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-semibold leading-tight sm:text-lg">
              Kapruka <span className="text-primary">Saama</span>
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-[11px]">සමා · Gift Concierge</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="hidden rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-700 sm:inline dark:text-emerald-400">
            Live Kapruka
          </span>
          <ThemeToggle />
          <CartPanel onCheckout={handleCheckout} />
        </div>
      </header>

      <div
        ref={scrollRef}
        className="chat-scroll content-padding mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto overscroll-y-contain py-4 sm:py-6"
      >
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center sm:mb-8"
          >
            <h2 className="font-display text-[1.625rem] font-bold leading-tight tracking-tight sm:text-4xl">
              {WELCOME.title}
            </h2>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground sm:max-w-md sm:text-base">
              {WELCOME.subtitle}
            </p>
            <p className="mx-auto mt-2 max-w-sm font-sinhala text-sm leading-relaxed text-primary/80 sm:text-base">
              {WELCOME.sinhala}
            </p>
            <div className="mt-6 sm:mt-8">
              <OccasionChips onSelect={handleSubmit} />
            </div>
          </motion.div>
        )}

        <div className="flex flex-col gap-3 sm:gap-4">
            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              const displayText =
                msg.role === "assistant"
                  ? getDisplayMessageText(msg, {
                      isLastMessage,
                      isStreaming: isLoading,
                    })
                  : getMessageText(msg);
              const activeTools = getActiveToolLoads(msg);
              const showThinking =
                msg.role === "assistant" &&
                isAssistantTurnInProgress(msg, {
                  isLastMessage,
                  isStreaming: isLoading,
                }) &&
                activeTools.length === 0;

              return (
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
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed sm:px-4 sm:py-3",
                      msg.role === "user"
                        ? "max-w-[min(90%,20rem)] break-words text-left bg-primary text-primary-foreground rounded-br-md sm:max-w-[85%]"
                        : "w-full min-w-0 max-w-full bg-card border border-border/50 rounded-bl-md shadow-sm sm:max-w-[min(100%,42rem)]"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Saama
                      </p>
                    )}
                    {msg.role === "assistant" ? (
                      <MarkdownMessage content={displayText} />
                    ) : (
                      <div className="break-words whitespace-pre-wrap">{displayText}</div>
                    )}

                    {activeTools.map((inv) => (
                      <ToolStatusCard
                        key={inv.toolCallId}
                        toolName={inv.toolName}
                        variant="loading"
                      />
                    ))}

                    {showThinking && <ThinkingLoader />}

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
              );
            })}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="w-full min-w-0 max-w-full rounded-2xl border border-border/50 bg-card px-4 py-3 shadow-sm rounded-bl-md sm:max-w-[min(100%,42rem)]">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Saama
                  </p>
                  <ThinkingLoader />
                </div>
              </motion.div>
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
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive">
            {error.message || "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      <div
        className="safe-bottom content-padding shrink-0 border-t border-border/50 bg-card/70 py-3 backdrop-blur-xl sm:py-3.5"
        style={keyboardOffset > 0 ? { paddingBottom: keyboardOffset } : undefined}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
              });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type in Sinhala, English, or Tanglish..."
            rows={1}
            enterKeyHint="send"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border/60 bg-background px-4 py-3 text-base leading-normal outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 sm:text-sm"
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
        <p className="mx-auto mt-1.5 hidden max-w-3xl text-center text-[10px] text-muted-foreground sm:mt-2 sm:block">
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

function ThinkingLoader() {
  return (
    <div
      className="mt-2 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"
      role="status"
      aria-live="polite"
      aria-label="Saama is thinking"
    >
      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Saama is thinking</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Checking Kapruka for you — this may take a few seconds
        </p>
        <div className="mt-2 flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="size-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
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
      <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs leading-relaxed text-destructive">
        {toolLabel(toolName)} failed
        {detail ? ` — ${detail}` : ""}. Please try again.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 shadow-sm"
      role="status"
      aria-live="polite"
      aria-label={`${toolLabel(toolName)} in progress`}
    >
      <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-4 animate-spin text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {toolLabel(toolName)}…
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{toolHint(toolName)}</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary/10">
          <motion.div
            className="h-full rounded-full bg-primary/60"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ width: "40%" }}
          />
        </div>
      </div>
    </motion.div>
  );
}