"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OccasionChips } from "./occasion-chips";
import { SpeechControls } from "./speech-controls";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import {
  getStoredSpeechLang,
  storeSpeechLang,
  useSpeechRecognition,
  type SpeechEndReason,
  type SpeechLanguageId,
} from "@/lib/hooks/use-speech-recognition";
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
  const speechBaseRef = useRef("");
  const speechFinalRef = useRef("");
  const inputValueRef = useRef("");
  const holdActiveRef = useRef(false);
  const [input, setInput] = useState("");
  const [speechLang, setSpeechLang] = useState<SpeechLanguageId>("si-LK");
  const isMobile = useIsMobile();
  const lastScrollHeightRef = useRef(0);
  const cartItems = useCartStore((s) => s.items);

  useEffect(() => {
    setSpeechLang(getStoredSpeechLang());
  }, []);

  useEffect(() => {
    inputValueRef.current = input;
  }, [input]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const onChatError = useCallback((err: Error) => {
    console.error("[chat]", err);
  }, []);

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onError: onChatError,
  });

  const isLoading = status === "submitted" || status === "streaming";

  const sendSpokenMessage = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || isLoading) return;
      speechBaseRef.current = "";
      speechFinalRef.current = "";
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      await sendMessage({ text: msg });
    },
    [isLoading, sendMessage],
  );

  const handleSpeechTranscript = useCallback((text: string, isFinal: boolean) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isFinal) {
      speechFinalRef.current = [speechFinalRef.current, trimmed]
        .filter(Boolean)
        .join(" ");
      setInput(
        [speechBaseRef.current, speechFinalRef.current].filter(Boolean).join(" "),
      );
    } else {
      const committed = [speechBaseRef.current, speechFinalRef.current]
        .filter(Boolean)
        .join(" ");
      setInput([committed, trimmed].filter(Boolean).join(" "));
    }
  }, []);

  const handleListeningEnd = useCallback(
    (reason: SpeechEndReason) => {
      if (reason === "no-speech") {
        toast.message("Didn't catch that — tap Speak and try again.");
        return;
      }

      const msg =
        [speechBaseRef.current, speechFinalRef.current]
          .filter(Boolean)
          .join(" ")
          .trim() || inputValueRef.current.trim();
      if (!msg) return;

      void sendSpokenMessage(msg);
    },
    [sendSpokenMessage],
  );

  const {
    isSupported: isSpeechSupported,
    isListening,
    start: startSpeech,
    stop: stopSpeech,
    cancel: cancelSpeech,
  } = useSpeechRecognition({
    lang: speechLang,
    onTranscript: handleSpeechTranscript,
    onError: (message) => toast.error(message),
    onListeningEnd: handleListeningEnd,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const frame = requestAnimationFrame(() => {
      const nextHeight = el.scrollHeight;
      if (nextHeight === lastScrollHeightRef.current) return;
      lastScrollHeightRef.current = nextHeight;
      el.scrollTop = nextHeight;
    });

    return () => cancelAnimationFrame(frame);
  }, [messages, isLoading]);

  const adjustTextareaHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  const beginSpeechCapture = useCallback(() => {
    speechBaseRef.current = inputValueRef.current;
    speechFinalRef.current = "";
    startSpeech();
  }, [startSpeech]);

  const handleMicClick = () => {
    if (isListening) {
      stopSpeech();
      return;
    }
    beginSpeechCapture();
    toast.message("Listening… pause to auto-send", { duration: 2200 });
  };

  const handleMicHoldStart = () => {
    if (isLoading || isListening) return;
    holdActiveRef.current = true;
    beginSpeechCapture();
    navigator.vibrate?.(12);
  };

  const handleMicHoldEnd = () => {
    if (!holdActiveRef.current) return;
    holdActiveRef.current = false;
    stopSpeech();
  };

  const handleSpeechLangChange = (lang: SpeechLanguageId) => {
    storeSpeechLang(lang);
    setSpeechLang(lang);
    if (isListening) cancelSpeech();
  };

  const handleSubmit = async (text?: string) => {
    cancelSpeech();
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    await sendMessage({ text: msg });
  };

  const handleCheckout = () => {
    const cartSummary = cartItems
      .map(
        (i) =>
          `- ${i.name} (ID: ${i.productId}) x${i.quantity} @ LKR ${i.price}`,
      )
      .join("\n");
    handleSubmit(
      `I'm ready to checkout. Here's my cart:\n${cartSummary}\n\nPlease help me complete the order with delivery details.`,
    );
  };

  const toolProducts = useMemo(() => {
    const products: ReturnType<typeof parseProductsFromToolResult> = [];
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      for (const inv of getToolParts(msg)) {
        if (
          inv.state === "output-available" &&
          (inv.toolName === "search_products" ||
            inv.toolName === "get_product") &&
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
            <p className="truncate text-xs text-muted-foreground sm:text-[11px]">
              සමා · Gift Concierge
            </p>
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
          <div className="animate-fade-in-up mb-6 text-center sm:mb-8">
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
          </div>
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
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed sm:px-4 sm:py-3",
                    msg.role === "user"
                      ? "max-w-[min(90%,20rem)] wrap-break-word text-left bg-primary text-primary-foreground rounded-br-md sm:max-w-[85%]"
                      : "w-full min-w-0 max-w-full bg-card border border-border/50 rounded-bl-md shadow-sm sm:max-w-[min(100%,42rem)]",
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
                    <div className="wrap-break-word whitespace-pre-wrap">
                      {displayText}
                    </div>
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
                      return (
                        <PayLinkCard key={inv.toolCallId} text={inv.output} />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="w-full min-w-0 max-w-full rounded-2xl border border-border/50 bg-card px-4 py-3 shadow-sm rounded-bl-md sm:max-w-[min(100%,42rem)]">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Saama
                </p>
                <ThinkingLoader />
              </div>
            </div>
          )}
        </div>

        {toolProducts.length > 0 && (
          <div className="animate-fade-in">
            <ProductCarousel products={toolProducts} />
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive">
            {error.message || "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      <div className="safe-bottom content-padding shrink-0 border-t border-border/50 bg-card/70 py-3 backdrop-blur-xl sm:py-3.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mx-auto max-w-3xl"
        >
          {isSpeechSupported && (
            <SpeechControls
              isListening={isListening}
              speechLang={speechLang}
              isLoading={isLoading}
              isMobile={isMobile}
              onLangChange={handleSpeechLangChange}
              onMicClick={handleMicClick}
              onMicHoldStart={handleMicHoldStart}
              onMicHoldEnd={handleMicHoldEnd}
            />
          )}
          <div
            className={cn(
              "chat-composer flex min-h-11 items-end rounded-2xl border bg-background shadow-sm transition focus-within:ring-2 focus-within:ring-primary/20",
              isListening
                ? "border-primary/50 ring-2 ring-primary/15"
                : "border-border/60 focus-within:border-primary/50",
            )}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                if (isListening) cancelSpeech();
                setInput(e.target.value);
              }}
              onFocus={() => {
                window.setTimeout(() => {
                  inputRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
                }, 300);
              }}
              onKeyDown={(e) => {
                if (isMobile) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                isListening
                  ? "Speak now…"
                  : isMobile
                    ? "Ask in Sinhala, English…"
                    : "Type in Sinhala, English, or Tanglish..."
              }
              rows={1}
              enterKeyHint={isMobile ? "enter" : "send"}
              className="max-h-32 min-h-11 min-w-0 flex-1 resize-none border-0 bg-transparent px-3.5 py-2.5 text-base leading-snug outline-none placeholder:leading-snug placeholder:text-muted-foreground/75 sm:px-4 sm:py-3 sm:text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="m-1 size-9 shrink-0 rounded-xl sm:m-1.5 sm:size-10"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
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
        <span className="absolute inset-0 animate-ping-soft rounded-full bg-primary/20" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">Saama is thinking</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Checking Kapruka for you — this may take a few seconds
        </p>
        <div className="mt-2 flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-primary animate-pulse-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
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
    <div
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
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {toolHint(toolName)}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full w-[40%] rounded-full bg-primary/60 animate-progress-slide"
          />
        </div>
      </div>
    </div>
  );
}
