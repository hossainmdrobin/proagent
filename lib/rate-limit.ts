import "server-only";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export interface RateLimitRule {
  scope: string;
  limit: number;
  windowMs: number;
}

const globalForRateLimit = globalThis as typeof globalThis & {
  __saadAgentRateLimit?: Map<string, RateLimitEntry>;
};

const entries: Map<string, RateLimitEntry> =
  (globalForRateLimit.__saadAgentRateLimit ??= new Map());

const globalForSweep = globalThis as typeof globalThis & {
  __saadAgentRateLimitSweep?: NodeJS.Timeout;
};

function startSweeper(): void {
  if (globalForSweep.__saadAgentRateLimitSweep) {
    return;
  }

  const timer = setInterval(() => {
    const now = Date.now();

    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) {
        entries.delete(key);
      }
    }
  }, 60_000);

  timer.unref?.();
  globalForSweep.__saadAgentRateLimitSweep = timer;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function consume(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const existing = entries.get(key);

  if (!existing || existing.resetAt <= now) {
    const entry: RateLimitEntry = { count: 1, resetAt: now + rule.windowMs };
    entries.set(key, entry);

    return {
      success: true,
      limit: rule.limit,
      remaining: rule.limit - 1,
      resetAt: entry.resetAt,
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;

  return {
    success: existing.count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function checkRateLimits(
  request: Request,
  rule: RateLimitRule,
  identifiers: Array<{ key: string; value: string }> = [],
): RateLimitResult {
  startSweeper();

  const results = [
    consume(`${rule.scope}:ip:${getClientIp(request)}`, rule),
    ...identifiers.map(({ key, value }) =>
      consume(`${rule.scope}:${key}:${value.toLowerCase()}`, rule),
    ),
  ];

  return results.find((result) => !result.success) ?? results[0];
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.success ? {} : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}
