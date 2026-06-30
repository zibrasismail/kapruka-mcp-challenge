import { callKaprukaTool } from "@/lib/mcp/client";
import { extractProductImage } from "@/lib/product-images";

const MAX_IDS = 12;

export async function POST(req: Request) {
  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  if (!ids.length) {
    return Response.json({ images: {} });
  }

  if (ids.length > MAX_IDS) {
    return Response.json(
      { error: `At most ${MAX_IDS} product IDs per request` },
      { status: 400 },
    );
  }

  const images: Record<string, string> = {};

  await Promise.all(
    ids.map(async (productId) => {
      try {
        const text = await callKaprukaTool("kapruka_get_product", {
          product_id: productId,
          response_format: "json",
        });

        const data = JSON.parse(text) as Record<string, unknown>;
        const image = extractProductImage(data);
        if (image) images[productId] = image;
      } catch {
        // Skip products that fail to load — carousel keeps placeholder.
      }
    }),
  );

  return Response.json({ images });
}