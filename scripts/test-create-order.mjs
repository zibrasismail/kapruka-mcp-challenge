/**
 * End-to-end MCP create_order smoke test.
 * Run: node scripts/test-create-order.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.kapruka.com/mcp";

async function main() {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  const client = new Client({ name: "kapruka-saama-test", version: "1.0.0" });
  await client.connect(transport);

  let product = null;
  for (const q of ["rose", "teddy", "chocolate"]) {
    const search = await client.callTool({
      name: "kapruka_search_products",
      arguments: { params: { q, limit: 1, response_format: "json" } },
    });
    const searchText = search.content?.[0]?.text ?? "";
    try {
      const parsed = JSON.parse(searchText);
      if (parsed.results?.[0]) {
        product = parsed.results[0];
        break;
      }
    } catch {
      // try next query
    }
  }
  if (!product) {
    product = { id: "SOFTTOY001031", name: "Stitch Plush Toy (fallback)" };
    console.warn("Search returned no results — using fallback product", product.id);
  }

  const cities = await client.callTool({
    name: "kapruka_list_delivery_cities",
    arguments: { params: { query: "Colombo 03", limit: 1 } },
  });
  const cityText = cities.content?.[0]?.text ?? "";
  const cityMatch = cityText.match(/\*\*([^*]+)\*\*/);
  const city = cityMatch?.[1]?.trim() ?? "Colombo 03";

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const date = deliveryDate.toISOString().slice(0, 10);

  const delivery = await client.callTool({
    name: "kapruka_check_delivery",
    arguments: {
      params: { city, delivery_date: date, product_id: product.id },
    },
  });
  console.log("Delivery check:", delivery.content?.[0]?.text?.split("\n")[0]);

  const order = await client.callTool({
    name: "kapruka_create_order",
    arguments: {
      params: {
        cart: [{ product_id: product.id, quantity: 1 }],
        recipient: { name: "Smoke Test Recipient", phone: "0771234567" },
        delivery: { address: "123 Test Street", city, date },
        sender: { name: "Smoke Test Sender" },
        gift_message: "Test order — please ignore",
      },
    },
  });

  const orderText = order.content?.[0]?.text ?? "";
  if (order.isError || orderText.startsWith("Error")) {
    throw new Error(orderText);
  }

  const payLink = orderText.match(/https:\/\/[^\s)]+/)?.[0];
  console.log("Order created successfully");
  console.log(orderText.split("\n").slice(0, 4).join("\n"));
  console.log("Pay link:", payLink ?? "(not found)");
}

main().catch((err) => {
  console.error("FAILED:", err.message ?? err);
  process.exit(1);
});