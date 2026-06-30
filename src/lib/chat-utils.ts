import { isToolUIPart, getToolName, type UIMessage } from "ai";

const CATALOG_TOOLS = new Set(["search_products", "get_product"]);

export function getMessageText(message: UIMessage): string {
  const textParts = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean);

  if (textParts.length === 0) return "";
  if (textParts.length === 1) return textParts[0];

  const catalogTools = getToolParts(message).filter((t) =>
    CATALOG_TOOLS.has(t.toolName)
  );
  const hasCatalogResults = catalogTools.some(
    (t) => t.state === "output-available"
  );

  // After search/product tools, show only the final formatted response
  // (skip "let me search..." filler that gets glued to results).
  if (hasCatalogResults) {
    return textParts[textParts.length - 1];
  }

  return textParts.join("\n\n");
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