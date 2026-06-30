"use client";

import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SPEECH_LANGUAGES,
  type SpeechLanguageId,
} from "@/lib/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

type SpeechControlsProps = {
  isListening: boolean;
  speechLang: SpeechLanguageId;
  isLoading: boolean;
  isMobile: boolean;
  onLangChange: (lang: SpeechLanguageId) => void;
  onMicClick: () => void;
  onMicHoldStart: () => void;
  onMicHoldEnd: () => void;
};

export function SpeechControls({
  isListening,
  speechLang,
  isLoading,
  isMobile,
  onLangChange,
  onMicClick,
  onMicHoldStart,
  onMicHoldEnd,
}: SpeechControlsProps) {
  const activeLang = SPEECH_LANGUAGES.find((l) => l.id === speechLang);

  return (
    <div className="mb-2 space-y-2">
      {isListening && (
        <div
          className="animate-fade-in flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2.5"
          role="status"
          aria-live="polite"
        >
          <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <span className="absolute inset-0 animate-ping-soft rounded-full bg-primary/25" />
            <Mic className="relative size-4 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Listening in {activeLang?.name ?? "Sinhala"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isMobile
                ? "Release the mic to send · or pause to auto-send"
                : "Pause speaking to auto-send · tap mic to send now"}
            </p>
          </div>
          <div className="flex shrink-0 items-end gap-0.5 pb-0.5" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-0.5 rounded-full bg-primary/70 animate-mic-bar"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div
          className="flex gap-0.5 rounded-full border border-border/50 bg-muted/50 p-0.5"
          role="group"
          aria-label="Voice input language"
        >
          {SPEECH_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              disabled={isLoading}
              onClick={() => onLangChange(lang.id)}
              aria-pressed={speechLang === lang.id}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                speechLang === lang.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant={isListening ? "default" : "outline"}
          size="sm"
          onClick={!isMobile ? onMicClick : undefined}
          onPointerDown={(e) => {
            if (!isMobile) return;
            e.preventDefault();
            onMicHoldStart();
          }}
          onPointerUp={() => {
            if (!isMobile) return;
            onMicHoldEnd();
          }}
          onPointerLeave={() => {
            if (!isMobile || !isListening) return;
            onMicHoldEnd();
          }}
          onPointerCancel={() => {
            if (!isMobile || !isListening) return;
            onMicHoldEnd();
          }}
          disabled={isLoading}
          aria-label={
            isListening
              ? isMobile
                ? "Release to send"
                : "Stop and send"
              : isMobile
                ? "Hold to speak"
                : "Speak your message"
          }
          aria-pressed={isListening}
          className={cn(
            "h-8 gap-1.5 rounded-full px-3 text-xs",
            isListening &&
              "relative border-destructive/30 bg-destructive text-white hover:bg-destructive/90",
          )}
        >
          {isListening ? (
            <>
              <MicOff className="size-3.5" />
              <span>{isMobile ? "Release" : "Send"}</span>
            </>
          ) : (
            <>
              <Mic className="size-3.5" />
              <span>{isMobile ? "Hold" : "Speak"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}