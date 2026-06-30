import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

const DEFAULT_BASE_URL = "https://9router.softwareaccess.in/v1";

const DEFAULT_MODEL = "ag/claude-sonnet-4-6";

const DEFAULT_FALLBACKS = [
  "ag/claude-opus-4-6-thinking",
  "ag/gemini-3-flash-agent",
  "mimo/mimo-v2.5-pro",
  "groq/llama-3.3-70b-versatile",
] as const;

function getBaseUrl(): string {
  return (
    process.env.NINEROUTER_BASE_URL ??
    process.env.OPENAI_API_BASE_URL ??
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");
}

function getApiKey(): string {
  const key =
    process.env.NINEROUTER_API_KEY ??
    process.env.OPENAI_API_KEY;

  if (!key || key.includes("your_") || key.includes("_here")) {
    throw new Error(
      "No API key configured. Set NINEROUTER_API_KEY in .env with your 9Router key."
    );
  }
  return key;
}

function createNineRouter() {
  return createOpenAI({
    apiKey: getApiKey(),
    baseURL: getBaseUrl(),
    name: "9router",
  });
}

export function getModelChain(): string[] {
  const primary = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const fallbacks = process.env.AI_MODEL_FALLBACKS
    ? process.env.AI_MODEL_FALLBACKS.split(",").map((m) => m.trim()).filter(Boolean)
    : [...DEFAULT_FALLBACKS];

  return [...new Set([primary, ...fallbacks])];
}

export function getModel(modelId?: string): LanguageModel {
  const openai = createNineRouter();
  // 9Router exposes an OpenAI Chat Completions endpoint, not Responses API.
  return openai.chat(modelId ?? getModelChain()[0]);
}

export function getProviderInfo() {
  return {
    baseUrl: getBaseUrl(),
    models: getModelChain(),
  };
}