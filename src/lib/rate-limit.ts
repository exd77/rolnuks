import "server-only";

type Entry = { count: number; resetAt: number };

declare global {
  var __orbloxRateLimitStore__: Map<string, Entry> | undefined;
}

const store = globalThis.__orbloxRateLimitStore__ ?? new Map<string, Entry>();
if (process.env.NODE_ENV !== "production")
  globalThis.__orbloxRateLimitStore__ = store;

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter: number;
};

export async function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const now = Date.now();
  const scopedKey = `${key}:${Math.floor(now / opts.windowMs)}`;
  const existing = store.get(scopedKey);
  const resetAt =
    Math.floor(now / opts.windowMs) * opts.windowMs + opts.windowMs;

  // Opportunistic cleanup to keep memory bounded.
  if (store.size > 1000) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) store.delete(k);
    }
  }

  const next = existing
    ? { count: existing.count + 1, resetAt: existing.resetAt }
    : { count: 1, resetAt };
  store.set(scopedKey, next);

  const remaining = Math.max(opts.limit - next.count, 0);
  return {
    ok: next.count <= opts.limit,
    limit: opts.limit,
    remaining,
    resetAt: new Date(next.resetAt),
    retryAfter: Math.max(Math.ceil((next.resetAt - now) / 1000), 1),
  };
}

export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
    ...(result.ok ? {} : { "Retry-After": String(result.retryAfter) }),
  };
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
