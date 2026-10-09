interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(key: string): Map<string, RateLimitEntry> {
  if (!stores.has(key)) {
    stores.set(key, new Map());
  }
  return stores.get(key)!;
}

export function createAiRateLimiter(limiterId: string, config: RateLimiterConfig) {
  const store = getStore(limiterId);

  return function checkRateLimit(userId: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const entry = store.get(userId);

    if (!entry || now - entry.windowStart >= config.windowMs) {
      store.set(userId, { count: 1, windowStart: now });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (entry.count >= config.maxRequests) {
      const retryAfterMs = config.windowMs - (now - entry.windowStart);
      return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
    }

    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

const ONE_HOUR_MS = 60 * 60 * 1000;
const MIN_RATE_LIMIT = 1;

function parseRateLimit(envVar: string | undefined, defaultValue: number): number {
  if (!envVar) return defaultValue;
  const parsed = parseInt(envVar, 10);
  if (!Number.isFinite(parsed) || parsed < MIN_RATE_LIMIT) return defaultValue;
  return parsed;
}

export const checkScanDocumentRateLimit = createAiRateLimiter("scan-document", {
  windowMs: ONE_HOUR_MS,
  maxRequests: parseRateLimit(process.env.SCAN_DOCUMENT_RATE_LIMIT, 10),
});

export const checkAssistantRateLimit = createAiRateLimiter("assistant", {
  windowMs: ONE_HOUR_MS,
  maxRequests: parseRateLimit(process.env.ASSISTANT_RATE_LIMIT, 30),
});
