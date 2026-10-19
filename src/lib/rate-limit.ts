import { NextResponse } from 'next/server';

/**
 * Rate limiter.
 *
 * Prefers Upstash REST (works across serverless instances). Falls back to a
 * per-instance in-memory Map — useful in dev / single-worker hosts, but NOT a
 * real defense on Vercel multi-instance prod. Set UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN to enable the distributed path.
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const distributed = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

/**
 * Client IP for rate limiting. x-forwarded-for is only trusted on Vercel, where
 * the platform overwrites it (first entry = the real client). Anywhere else the
 * header is client-controlled, so fall back to x-real-ip (set by a reverse proxy)
 * or a constant, which makes every request share one bucket per scope.
 */
export function clientIp(req: Request): string {
  if (process.env.VERCEL) {
    const first = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  return 'local';
}

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------

// Keyed by `${scope}:${key}` so each limit (login, contact, seed...) has its own bucket.
const buckets = new Map<string, { count: number; lastReset: number; windowMs: number }>();

function sweepExpired() {
  const now = Date.now();
  for (const [k, record] of buckets) {
    if (now - record.lastReset > record.windowMs * 2) buckets.delete(k);
  }
}

function inMemoryLimit(key: string, limit: number, windowMs: number, scope: string): boolean {
  const now = Date.now();
  if (Math.random() < 0.01) sweepExpired();
  const bucketKey = `${scope}:${key}`;
  const record = buckets.get(bucketKey) ?? { count: 0, lastReset: now, windowMs };
  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }
  record.count += 1;
  buckets.set(bucketKey, record);
  return record.count > limit;
}

// ---------------------------------------------------------------------------
// Upstash distributed
// ---------------------------------------------------------------------------

async function upstashLimit(
  ip: string,
  limit: number,
  windowMs: number,
  scope: string
): Promise<boolean> {
  const key = `rl:${scope}:${ip}`;
  const ttlSec = Math.ceil(windowMs / 1000);

  // Pipeline: INCR + EXPIRE NX (set TTL only if missing) in a single round trip.
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, ttlSec, 'NX'],
    ]),
    // Don't let a slow Redis hold up the request indefinitely.
    signal: AbortSignal.timeout(800),
  });

  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const payload = (await res.json()) as Array<{ result?: number; error?: string }>;
  const count = payload[0]?.result ?? 0;
  return count > limit;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Count one hit for `key` in `scope`. Returns true when the limit is exceeded.
 * Use this directly for keys that are not just the IP (e.g. email + IP on login).
 */
export async function hitLimit(key: string, limit: number, windowMs: number, scope: string): Promise<boolean> {
  if (distributed) {
    try {
      return await upstashLimit(key, limit, windowMs, scope);
    } catch {
      // If Upstash is down, do not block traffic; fall through to in-memory.
    }
  }
  return inMemoryLimit(key, limit, windowMs, scope);
}

/** True when `key` already reached `limit` hits in its current window (does not count a hit). */
export async function peekLimit(key: string, limit: number, scope: string): Promise<boolean> {
  if (distributed) {
    try {
      const res = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(`rl:${scope}:${key}`)}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        signal: AbortSignal.timeout(800),
      });
      if (res.ok) {
        const payload = (await res.json()) as { result?: string | null };
        return Number(payload.result ?? 0) >= limit;
      }
    } catch {
      // fall through to in-memory
    }
  }
  const record = buckets.get(`${scope}:${key}`);
  if (!record || Date.now() - record.lastReset > record.windowMs) return false;
  return record.count >= limit;
}

/** Clear the counter for `key` (e.g. after a successful login). */
export async function resetLimit(key: string, scope: string): Promise<void> {
  buckets.delete(`${scope}:${key}`);
  if (distributed) {
    try {
      await fetch(`${UPSTASH_URL}/del/${encodeURIComponent(`rl:${scope}:${key}`)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        signal: AbortSignal.timeout(800),
      });
    } catch {
      // non-fatal
    }
  }
}

export async function rateLimit(
  req: Request,
  limit = 10,
  windowMs = 60_000,
  scope = 'default'
): Promise<NextResponse | null> {
  const exceeded = await hitLimit(clientIp(req), limit, windowMs, scope);
  if (exceeded) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) } }
    );
  }
  return null;
}
