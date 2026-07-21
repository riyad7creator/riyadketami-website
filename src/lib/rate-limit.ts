import { NextResponse } from 'next/server';

const ipRequests = new Map<string, { count: number; lastReset: number }>();

function sweepExpired(windowMs: number) {
  const cutoff = Date.now() - windowMs * 2;
  for (const [ip, record] of ipRequests) {
    if (record.lastReset < cutoff) ipRequests.delete(ip);
  }
}

/**
 * Derive the real client IP rather than trusting the raw x-forwarded-for value.
 * Reverse proxies (Vercel's edge included) APPEND the connecting socket's IP to
 * any client-supplied X-Forwarded-For rather than replacing it, so the last
 * entry is the one the proxy itself observed and the client cannot forge it.
 * Taking the header verbatim (the previous behavior) let an attacker bypass
 * every limit below by sending a different X-Forwarded-For value per request.
 */
function getClientIp(req: Request): string {
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const hops = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1] as string;
  }

  return 'unknown';
}

/**
 * NOTE: this store is an in-memory Map, scoped to a single serverless function
 * instance. On multi-instance deployments (Vercel included) each instance has
 * its own counters, so the effective limit is (limit × concurrent instances),
 * and counters reset on cold start. For a hard guarantee under real load this
 * needs a shared store (e.g. Upstash Redis + @upstash/ratelimit). Left as-is
 * here since that requires provisioning an external service and credentials
 * this environment doesn't have — flagging so it isn't mistaken for solved.
 */
export function rateLimit(req: Request, limit = 10, windowMs = 60000) {
  const ip = getClientIp(req);
  const now = Date.now();

  if (Math.random() < 0.01) sweepExpired(windowMs);

  const record = ipRequests.get(ip) ?? { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }

  record.count += 1;
  ipRequests.set(ip, record);

  if (record.count > limit) {
    return NextResponse.json({ error: 'Too many requests, please try again later.' }, { status: 429 });
  }

  return null;
}
