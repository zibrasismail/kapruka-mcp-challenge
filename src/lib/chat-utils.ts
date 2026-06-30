import { isToolUIPart, getToolName, type UIMessage } from "ai";
import { parseProductsFromToolResult } from "@/lib/parse-products";

function getAllTextParts(message: UIMessage): string[] {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean);
}

function getTextAfterLastTool(message: UIMessage): string {
  let lastToolIdx = -1;
  for (let i = 0; i < message.parts.length; i++) {
    if (isToolUIPart(message.parts[i])) lastToolIdx = i;
  }

  const textParts = message.parts
    .slice(lastToolIdx + 1)
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean);

  if (textParts.length === 0) return "";
  if (textParts.length === 1) return textParts[0];
  return textParts[textParts.length - 1];
}

function looksLikeInterimNarration(text: string): boolean {
  if (!text) return true;
  if (text.length >= 320) return false;
  if (text.includes("|") || text.includes("###") || text.includes("\n- ")) {
    return false;
  }
  return true;
}

export function getMessageText(message: UIMessage): string {
  const textParts = getAllTextParts(message);
  if (textParts.length === 0) return "";
  if (textParts.length === 1) return textParts[0];
  return textParts[textParts.length - 1];
}

export function getDisplayMessageText(
  message: UIMessage,
  opts?: { isLastMessage?: boolean; isStreaming?: boolean }
): string {
  const toolParts = getToolParts(message);
  const activeLoads = getActiveToolLoads(message);
  const isLastStreaming = Boolean(opts?.isLastMessage && opts?.isStreaming);

  if (activeLoads.length > 0) return "";

  if (isLastStreaming) {
    if (toolParts.length > 0) return "";
    const interim = getAllTextParts(message).join("\n\n");
    return looksLikeInterimNarration(interim) ? "" : interim;
  }

  const hasCompletedTools = toolParts.some(
    (t) => t.state === "output-available" || t.state === "output-error"
  );
  if (hasCompletedTools) {
    return getTextAfterLastTool(message);
  }

  const textParts = getAllTextParts(message);
  if (textParts.length <= 1) return textParts[0] ?? "";
  return textParts[textParts.length - 1];
}

export function getMessageProducts(message: UIMessage) {
  if (message.role !== "assistant") return [];

  const products: ReturnType<typeof parseProductsFromToolResult> = [];

  for (const inv of getToolParts(message)) {
    if (
      inv.state === "output-available" &&
      (inv.toolName === "search_products" || inv.toolName === "get_product") &&
      typeof inv.output === "string"
    ) {
      products.push(...parseProductsFromToolResult(inv.output));
    }
  }

  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export function isAssistantTurnInProgress(
  message: UIMessage,
  opts?: { isLastMessage?: boolean; isStreaming?: boolean }
): boolean {
  if (message.role !== "assistant") return false;
  if (!opts?.isLastMessage || !opts?.isStreaming) return false;
  if (getActiveToolLoads(message).length > 0) return true;
  if (getToolParts(message).length > 0) return true;
  return looksLikeInterimNarration(getAllTextParts(message).join("\n\n"));
}

export interface ToolPartInfo {
  toolCallId: string;
  toolName: string;
  state: string;
  output?: unknown;
  errorText?: string;
}

export function getToolParts(message: UIMessage): ToolPartInfo[] {
  return message.parts
    .filter(isToolUIPart)
    .map((part) => ({
      toolCallId: part.toolCallId,
      toolName: getToolName(part),
      state: part.state,
      output:
        part.state === "output-available"
          ? part.output
          : undefined,
      errorText:
        part.state === "output-error" && "errorText" in part
          ? String(part.errorText)
          : undefined,
    }));
}

export function isToolInFlight(inv: ToolPartInfo): boolean {
  return inv.state === "input-streaming" || inv.state === "input-available";
}

/** One loader per tool name — avoids duplicate "Searching Kapruka" rows. */
export function getActiveToolLoads(message: UIMessage): ToolPartInfo[] {
  const seen = new Set<string>();
  return getToolParts(message).filter((inv) => {
    if (!isToolInFlight(inv)) return false;
    if (seen.has(inv.toolName)) return false;
    seen.add(inv.toolName);
    return true;
  });
}