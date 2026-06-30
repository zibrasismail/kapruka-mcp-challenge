"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "Microphone access was denied. Allow mic permission in your browser settings.",
  "no-speech": "Didn't catch that — try speaking again.",
  network: "Speech recognition needs an internet connection.",
  "audio-capture": "No microphone found.",
  "service-not-allowed": "Speech recognition is not available on this device.",
};

export function useSpeechRecognition(options?: {
  lang?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
}) {
  const lang = options?.lang ?? "si-LK";
  const onTranscriptRef = useRef(options?.onTranscript);
  const onErrorRef = useRef(options?.onError);

  useEffect(() => {
    onTranscriptRef.current = options?.onTranscript;
    onErrorRef.current = options?.onError;
  }, [options?.onTranscript, options?.onError]);

  const [isSupported] = useState(() => !!getSpeechRecognitionCtor());
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      onErrorRef.current?.(
        "Speech recognition is not supported in this browser. Try Chrome or Edge.",
      );
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) final += text;
        else interim += text;
      }

      if (final.trim()) onTranscriptRef.current?.(final, true);
      else if (interim.trim()) onTranscriptRef.current?.(interim, false);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      onErrorRef.current?.(
        ERROR_MESSAGES[event.error] ??
          "Speech recognition failed. Please try again.",
      );
      setIsListening(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      onErrorRef.current?.("Could not start speech recognition.");
      setIsListening(false);
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { isSupported, isListening, start, stop, toggle };
}