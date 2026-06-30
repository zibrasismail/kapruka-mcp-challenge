import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(new URL("https://mcp.kapruka.com/mcp"));
const client = new Client({ name: "test", version: "1.0.0" });
await client.connect(transport);
const result = await client.callTool({
  name: "kapruka_search_products",
  arguments: { params: { q: "chocolate", limit: 3, response_format: "json" } },
});
const text = result.content?.map((c) => c.text ?? JSON.stringify(c)).join("\n");
console.log("LENGTH:", text?.length ?? 0);
console.log(text?.slice(0, 3000) ?? "NO CONTENT");