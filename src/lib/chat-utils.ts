import { isToolUIPart, getToolName, type UIMessage } from "ai";

export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export interface ToolPartInfo {
  toolCallId: string;
  toolName: string;
  state: string;
  output?: unknown;
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
    }));
}