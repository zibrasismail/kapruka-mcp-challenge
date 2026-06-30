"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

export const SPEECH_LANGUAGES = [
  { id: "si-LK", label: "සිං", name: "Sinhala" },
  { id: "en-LK", label: "EN", name: "English" },
] as const;

export type SpeechLanguageId = (typeof SPEECH_LANGUAGES)[number]["id"];
export type SpeechEndReason = "manual" | "silence" | "timeout" | "no-speech";

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** True when this browser exposes the Web Speech API (Chrome, Edge, Safari). */
export function isSpeechRecognitionAvailable(): boolean {
  return !!getSpeechRecognitionCtor();
}

/**
 * Client-only check — false during SSR and on unsupported browsers (e.g. Firefox).
 * Uses layout effect so desktop Chrome/Edge pick up support before first paint.
 */
export function useSpeechSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useLayoutEffect(() => {
    setSupported(isSpeechRecognitionAvailable());
  }, []);

  return supported;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "Microphone access was denied. Allow mic permission in your browser settings.",
  "no-speech": "Didn't catch that — try speaking again.",
  network: "Speech recognition needs an internet connection.",
  "audio-capture": "No microphone found.",
  "service-not-allowed": "Speech recognition is not available on this device.",
  "language-not-supported": "This language is not supported for voice input here.",
};

const SILENCE_MS = 2200;
const MAX_LISTEN_MS = 45_000;
const NO_SPEECH_MS = 8_000;

export function useSpeechRecognition(options?: {
  lang?: string;
  silenceMs?: number;
  autoStopOnSilence?: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onListeningEnd?: (reason: SpeechEndReason) => void;
}) {
  const lang = options?.lang ?? "si-LK";
  const silenceMs = options?.silenceMs ?? SILENCE_MS;
  const autoStopOnSilence = options?.autoStopOnSilence ?? false;

  const onTranscriptRef = useRef(options?.onTranscript);
  const onErrorRef = useRef(options?.onError);
  const onListeningEndRef = useRef(options?.onListeningEnd);
  const autoStopOnSilenceRef = useRef(autoStopOnSilence);

  useEffect(() => {
    onTranscriptRef.current = options?.onTranscript;
    onErrorRef.current = options?.onError;
    onListeningEndRef.current = options?.onListeningEnd;
    autoStopOnSilenceRef.current = options?.autoStopOnSilence ?? false;
  }, [
    options?.onTranscript,
    options?.onError,
    options?.onListeningEnd,
    options?.autoStopOnSilence,
  ]);

  const isSupported = useSpeechSupported();
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const wantListeningRef = useRef(false);
  const manualStopRef = useRef(false);
  const skipEndCallbackRef = useRef(false);
  const endReasonRef = useRef<SpeechEndReason>("manual");
  const hasTranscriptRef = useRef(false);
  const listenStartedAtRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxListenTimerRef.current) {
      clearTimeout(maxListenTimerRef.current);
      maxListenTimerRef.current = null;
    }
  }, []);

  const finishListening = useCallback(
    (reason: SpeechEndReason) => {
      wantListeningRef.current = false;
      manualStopRef.current = true;
      endReasonRef.current = reason;
      clearTimers();
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setIsListening(false);
      onListeningEndRef.current?.(reason);
    },
    [clearTimers],
  );

  const scheduleSilenceCheck = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(() => {
      if (!wantListeningRef.current) return;

      if (hasTranscriptRef.current && autoStopOnSilenceRef.current) {
        finishListening("silence");
        return;
      }

      if (Date.now() - listenStartedAtRef.current >= NO_SPEECH_MS) {
        finishListening("no-speech");
        return;
      }

      scheduleSilenceCheck();
    }, silenceMs);
  }, [finishListening, silenceMs]);

  const bindRecognition = useCallback(
    (recognition: SpeechRecognition) => {
      recognition.onresult = (event) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? "";
          if (result.isFinal) final += text;
          else interim += text;
        }

        if (final.trim()) {
          hasTranscriptRef.current = true;
          onTranscriptRef.current?.(final, true);
          scheduleSilenceCheck();
        } else if (interim.trim()) {
          hasTranscriptRef.current = true;
          onTranscriptRef.current?.(interim, false);
          scheduleSilenceCheck();
        }
      };

      recognition.onerror = (event) => {
        if (event.error === "aborted") return;

        if (event.error === "no-speech" && wantListeningRef.current) {
          if (!hasTranscriptRef.current) scheduleSilenceCheck();
          return;
        }

        wantListeningRef.current = false;
        manualStopRef.current = true;
        clearTimers();
        setIsListening(false);

        onErrorRef.current?.(
          ERROR_MESSAGES[event.error] ??
            "Speech recognition failed. Please try again.",
        );
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        if (wantListeningRef.current && !manualStopRef.current) {
          const Ctor = getSpeechRecognitionCtor();
          if (Ctor) {
            try {
              const next = new Ctor();
              next.continuous = true;
              next.interimResults = true;
              next.lang = lang;
              next.maxAlternatives = 1;
              bindRecognition(next);
              next.start();
              recognitionRef.current = next;
              return;
            } catch {
              /* fall through */
            }
          }
        }

        setIsListening(false);
        if (manualStopRef.current && !skipEndCallbackRef.current) {
          onListeningEndRef.current?.(endReasonRef.current);
        }
        skipEndCallbackRef.current = false;
      };
    },
    [clearTimers, lang, scheduleSilenceCheck],
  );

  const cancel = useCallback(() => {
    wantListeningRef.current = false;
    manualStopRef.current = true;
    skipEndCallbackRef.current = true;
    clearTimers();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setIsListening(false);
  }, [clearTimers]);

  const stop = useCallback(() => {
    if (!wantListeningRef.current && !recognitionRef.current) return;
    finishListening("manual");
  }, [finishListening]);

  const start = useCallback(() => {
    if (!isSupported) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      onErrorRef.current?.(
        "Speech recognition is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }

    wantListeningRef.current = true;
    manualStopRef.current = false;
    hasTranscriptRef.current = false;
    listenStartedAtRef.current = Date.now();
    endReasonRef.current = "manual";

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;
    bindRecognition(recognition);
    recognitionRef.current = recognition;

    clearTimers();
    maxListenTimerRef.current = setTimeout(() => {
      if (wantListeningRef.current) finishListening("timeout");
    }, MAX_LISTEN_MS);

    scheduleSilenceCheck();

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      wantListeningRef.current = false;
      clearTimers();
      onErrorRef.current?.("Could not start speech recognition.");
      setIsListening(false);
    }
  }, [bindRecognition, clearTimers, finishListening, isSupported, lang, scheduleSilenceCheck]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(
    () => () => {
      wantListeningRef.current = false;
      manualStopRef.current = true;
      clearTimers();
      recognitionRef.current?.abort();
    },
    [clearTimers],
  );

  return { isSupported, isListening, start, stop, cancel, toggle };
}

export function getStoredSpeechLang(): SpeechLanguageId {
  if (typeof window === "undefined") return "si-LK";
  const stored = localStorage.getItem("saama-speech-lang");
  return stored === "en-LK" ? "en-LK" : "si-LK";
}

export function storeSpeechLang(lang: SpeechLanguageId) {
  localStorage.setItem("saama-speech-lang", lang);
}

export function getStoredSpeechAutoSend(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("saama-speech-auto-send") === "true";
}

export function storeSpeechAutoSend(enabled: boolean) {
  localStorage.setItem("saama-speech-auto-send", enabled ? "true" : "false");
}