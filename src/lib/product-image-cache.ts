/** Shared across carousel mounts so images are not re-fetched. */
export const productImageCache = new Map<string, string>();

export const pendingEnrichmentKeys = new Set<string>();