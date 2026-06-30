"use client";

import { Mic } from "lucide-react";
import {
  SPEECH_LANGUAGES,
  type SpeechLanguageId,
} from "@/lib/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";

type SpeechControlsProps = {
  isListening: boolean;
  speechLang: SpeechLanguageId;
  speechAutoSend: boolean;
  isLoading: boolean;
  onLangChange: (lang: SpeechLanguageId) => void;
  onAutoSendChange: (enabled: boolean) => void;
};

export function SpeechControls({
  isListening,
  speechLang,
  speechAutoSend,
  isLoading,
  onLangChange,
  onAutoSendChange,
}: SpeechControlsProps) {
  const activeLang = SPEECH_LANGUAGES.find((l) => l.id === speechLang);

  const listeningHint = speechAutoSend
    ? "Pause speaking to auto-send · tap mic to stop"
    : "Tap mic to stop · then tap send";

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
            <p className="text-xs text-muted-foreground">{listeningHint}</p>
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

      <div className="flex flex-wrap items-center gap-1.5">
        <div
          className="flex gap-0.5 rounded-full border border-border/50 bg-muted/50 p-0.5"
          role="group"
          aria-label="Voice input language"
        >
          {SPEECH_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              disabled={isLoading || isListening}
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

        <button
          type="button"
          disabled={isLoading || isListening}
          onClick={() => onAutoSendChange(!speechAutoSend)}
          aria-pressed={speechAutoSend}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
            speechAutoSend
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border/50 bg-muted/50 text-muted-foreground hover:text-foreground",
          )}
        >
          Auto-send {speechAutoSend ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}