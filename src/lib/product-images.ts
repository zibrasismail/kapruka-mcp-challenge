const KAPRUKA_ORIGIN = "https://www.kapruka.com";

/** Fix Kapruka URLs that sometimes arrive with a single-slash protocol or as paths. */
export function normalizeKaprukaImageUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url || typeof url !== "string") return undefined;

  let normalized = url.trim();
  if (!normalized) return undefined;

  normalized = normalized.replace(/^(https?):\/([^/])/i, "$1://$2");

  if (normalized.startsWith("//")) {
    normalized = `https:${normalized}`;
  } else if (normalized.startsWith("/")) {
    normalized = `${KAPRUKA_ORIGIN}${normalized}`;
  }

  if (!/^https?:\/\//i.test(normalized)) return undefined;

  return normalized;
}

function pickImageCandidate(value: unknown): string | undefined {
  if (typeof value === "string") {
    return normalizeKaprukaImageUrl(value);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      normalizeKaprukaImageUrl(record.url as string | undefined) ??
      normalizeKaprukaImageUrl(record.src as string | undefined) ??
      normalizeKaprukaImageUrl(record.image_url as string | undefined)
    );
  }

  return undefined;
}

/** Pull the best image URL from a Kapruka search row or get_product payload. */
export function extractProductImage(data: Record<string, unknown>): string | undefined {
  const fromSearch = pickImageCandidate(data.image_url);
  if (fromSearch) return fromSearch;

  const images = data.images;
  if (Array.isArray(images)) {
    for (const entry of images) {
      const url = pickImageCandidate(entry);
      if (url) return url;
    }
  }

  return undefined;
}