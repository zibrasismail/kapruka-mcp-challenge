import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  isStepCount,
  type UIMessage,
} from "ai";
import { SAAMA_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { kaprukaTools } from "@/lib/ai/tools";
import { getModel, getModelChain } from "@/lib/ai/provider";

export const maxDuration = 60;

function friendlyAiError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("ECONNREFUSED") || message.includes("Cannot connect to API")) {
    return (
      "Cannot reach 9Router. Check NINEROUTER_BASE_URL in .env " +
      "(default: https://9router.softwareaccess.in/v1) and that the proxy is running."
    );
  }

  if (message.includes("401") || message.includes("authentication") || message.includes("Unauthorized")) {
    return "Invalid 9Router API key. Update NINEROUTER_API_KEY in .env.";
  }

  if (message.includes("No API key configured")) {
    return message;
  }

  return message;
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const modelMessages = await convertToModelMessages(messages);
    const modelChain = getModelChain();

    let lastError: unknown;

    for (let i = 0; i < modelChain.length; i++) {
      const modelId = modelChain[i];
      try {
        const result = streamText({
          model: getModel(modelId),
          instructions: SAAMA_SYSTEM_PROMPT,
          messages: modelMessages,
          tools: kaprukaTools,
          stopWhen: isStepCount(5),
          temperature: 0.7,
        });

        const uiStream = toUIMessageStream({
          stream: result.stream,
          originalMessages: messages,
        });

        if (i > 0) {
          console.info(`[api/chat] using fallback model: ${modelId}`);
        }

        return createUIMessageStreamResponse({ stream: uiStream });
      } catch (err) {
        lastError = err;
        console.warn(`[api/chat] model ${modelId} failed:`, err);
      }
    }

    throw lastError ?? new Error("All models in the fallback chain failed.");
  } catch (err) {
    const message = friendlyAiError(err);
    console.error("[api/chat]", err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}