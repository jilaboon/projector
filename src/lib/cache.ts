// Simple client-side stale-while-revalidate cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const inflight = new Map<string, Promise<unknown>>();
const TTL = 30_000; // 30 seconds

type CacheOptions = {
  /** Force a fresh fetch, ignoring cache */
  force?: boolean;
  /** Called when background revalidation completes with new data */
  onRevalidate?: (data: unknown) => void;
};

export async function fetchWithCache<T>(
  url: string,
  options?: CacheOptions
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(url);

  // Return cached data if fresh
  if (!options?.force && cached && now - cached.timestamp < TTL) {
    // Revalidate in background if older than half the TTL
    if (now - cached.timestamp > TTL / 2) {
      revalidate(url, options?.onRevalidate);
    }
    return cached.data as T;
  }

  // If there's already an inflight request for this URL, reuse it
  if (inflight.has(url)) {
    return inflight.get(url) as Promise<T>;
  }

  const promise = doFetch<T>(url);
  inflight.set(url, promise);

  try {
    const data = await promise;
    return data;
  } finally {
    inflight.delete(url);
  }
}

async function doFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

function revalidate(url: string, onUpdate?: (data: unknown) => void) {
  if (inflight.has(url)) return;
  const promise = doFetch(url);
  inflight.set(url, promise);
  promise
    .then((data) => {
      onUpdate?.(data);
    })
    .catch(() => {})
    .finally(() => inflight.delete(url));
}

/** Invalidate a specific cache entry (e.g. after creating/updating) */
export function invalidateCache(url?: string) {
  if (url) {
    cache.delete(url);
  } else {
    cache.clear();
  }
}
