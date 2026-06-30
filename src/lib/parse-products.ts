import type { ProductData } from "@/components/commerce/product-card";
import { extractProductImage, normalizeKaprukaImageUrl } from "@/lib/product-images";

export function parseProductsFromToolResult(text: string): ProductData[] {
  try {
    const json = JSON.parse(text);
    if (json.results && Array.isArray(json.results)) {
      return json.results
        .filter((r: { id?: string; name?: string }) => r.id && r.name)
        .map((r: {
          id: string;
          name: string;
          price?: { amount?: number };
          image_url?: string;
          images?: unknown[];
          url?: string;
          in_stock?: boolean;
        }) => ({
          id: r.id,
          name: r.name,
          price: r.price?.amount ?? 0,
          image: extractProductImage(r as Record<string, unknown>),
          url: r.url,
          inStock: r.in_stock ?? true,
        }));
    }
    if (json.id && json.name) {
      return [
        {
          id: json.id,
          name: json.name,
          price: json.price?.amount ?? 0,
          image: extractProductImage(json as Record<string, unknown>),
          url: json.url,
          inStock: json.in_stock ?? true,
        },
      ];
    }
  } catch {
    // fall through to markdown parsing
  }

  const products: ProductData[] = [];
  const blocks = text.split(/\n(?=\*\*\d+\.|\#\# )/);

  for (const block of blocks) {
    const nameMatch = block.match(/\*\*\d+\.\s+(.+?)\*\*/);
    const headingMatch = block.match(/^##\s+(.+)/m);
    const idMatch = block.match(/ID[:\s]+`([^`]+)`/i);
    const priceMatch = block.match(/LKR\s*([\d,]+(?:\.\d+)?)/i);
    const urlMatch = block.match(/\((https?:\/\/[^)]*kapruka[^)]*)\)/i);
    const imageMatch = block.match(/\*\*Image\*\*:\s*(https?:\/\/\S+)/i);

    const name = nameMatch?.[1]?.replace(/_\(browse page\)_/i, "").trim()
      ?? headingMatch?.[1]?.trim();

    if (!name || name.includes("Kapruka search")) continue;

    const id = idMatch?.[1];
    if (!id || id.toUpperCase().startsWith("CATSYM")) continue;

    products.push({
      id,
      name,
      price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 0,
      url: urlMatch?.[1],
      image: normalizeKaprukaImageUrl(imageMatch?.[1]),
      inStock: !block.toLowerCase().includes("out of stock"),
    });
  }

  const seen = new Set<string>();
  return products.filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}