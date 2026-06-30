import "server-only";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.kapruka.com/mcp";

let clientPromise: Promise<Client> | null = null;

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

export async function callKaprukaTool(
  name: string,
  args: Record<string, unknown> = {}
): Promise<string> {
  const client = await getClient();
  const result = await client.callTool({
    name,
    arguments: { params: args },
  });
  return extractText(result as { content?: Array<{ type: string; text?: string }> });
}