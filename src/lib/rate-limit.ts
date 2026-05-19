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

/** Vercel sets x-real-ip; otherwise take first hop of x-forwarded-for. */
function clientIp(req: Request): string {
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return 'unknown';
}

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------

const ipRequests = new Map<string, { count: number; lastReset: number }>();

function sweepExpired(windowMs: number) {
  const cutoff = Date.now() - windowMs * 2;
  for (const [ip, record] of ipRequests) {
    if (record.lastReset < cutoff) ipRequests.delete(ip);
  }
}

function inMemoryLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (Math.random() < 0.01) sweepExpired(windowMs);
  const record = ipRequests.get(ip) ?? { count: 0, lastReset: now };
  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }
  record.count += 1;
  ipRequests.set(ip, record);
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

export async function rateLimit(
  req: Request,
  limit = 10,
  windowMs = 60_000,
  scope = 'default'
): Promise<NextResponse | null> {
  const ip = clientIp(req);

  let exceeded = false;
  if (distributed) {
    try {
      exceeded = await upstashLimit(ip, limit, windowMs, scope);
    } catch {
      // If Upstash is down, do not block traffic; fall through to in-memory.
      exceeded = inMemoryLimit(ip, limit, windowMs);
    }
  } else {
    exceeded = inMemoryLimit(ip, limit, windowMs);
  }

  if (exceeded) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) } }
    );
  }
  return null;
}
