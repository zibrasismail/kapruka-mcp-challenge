import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.kapruka.com/mcp";
const CACHE_TTL_MS = 15 * 60 * 1000; // match Kapruka server cache
const MCP_TIMEOUT_MS = 20_000;

const READ_TOOLS = new Set([
  "kapruka_search_products",
  "kapruka_get_product",
  "kapruka_list_categories",
  "kapruka_list_delivery_cities",
  "kapruka_check_delivery",
]);

const cache = new Map<string, { value: string; expiry: number }>();

let clientPromise: Promise<Client> | null = null;

// Pre-connect so the first user search isn't blocked on MCP handshake (~1s).
void getClient().catch(() => {});

async function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
      const client = new Client({
        name: "kapruka-saama",
        version: "1.0.0",
      });
      await client.connect(transport);
      return client;
    })();
  }
  return clientPromise;
}

function extractText(result: {
  content?: Array<{ type: string; text?: string }>;
}): string {
  if (!result.content?.length) return "";
  return result.content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text)
    .join("\n");
}

/** Strip verbose fields so less tokens go back to the LLM (faster follow-up turns). */
function compactToolResult(toolName: string, text: string): string {
  try {
    const data = JSON.parse(text);

    if (toolName === "kapruka_search_products" && Array.isArray(data.results)) {
      return JSON.stringify({
        results: data.results.map((r: Record<string, unknown>) => ({
          id: r.id,
          name: r.name,
          price: r.price,
          in_stock: r.in_stock,
          image_url: r.image_url,
          url: r.url,
        })),
        next_cursor: data.next_cursor ?? null,
      });
    }

    if (toolName === "kapruka_get_product" && data.id) {
      return JSON.stringify({
        id: data.id,
        name: data.name,
        price: data.price,
        in_stock: data.in_stock,
        images: data.images?.slice(0, 2),
        url: data.url,
        variants: data.variants?.slice(0, 4)?.map((v: Record<string, unknown>) => ({
          id: v.id,
          name: v.name,
          price: v.price,
          in_stock: v.in_stock,
        })),
      });
    }
  } catch {
    // not JSON — return as-is
  }
  return text;
}

export async function callKaprukaTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<string> {
  const cacheKey = `${name}:${JSON.stringify(args)}`;

  if (READ_TOOLS.has(name)) {
    const hit = cache.get(cacheKey);
    if (hit && hit.expiry > Date.now()) {
      return hit.value;
    }
  }

  const started = Date.now();
  const client = await getClient();
  const result = await Promise.race([
    client.callTool({
      name,
      arguments: { params: args },
    }),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Kapruka MCP timed out after ${MCP_TIMEOUT_MS / 1000}s`)),
        MCP_TIMEOUT_MS
      );
    }),
  ]);
  const raw = extractText(result as { content?: Array<{ type: string; text?: string }> });
  const compact = compactToolResult(name, raw);

  if (process.env.NODE_ENV === "development") {
    console.info(`[mcp] ${name} ${Date.now() - started}ms (${compact.length} chars)`);
  }

  if (READ_TOOLS.has(name)) {
    cache.set(cacheKey, { value: compact, expiry: Date.now() + CACHE_TTL_MS });
  }

  return compact;
}