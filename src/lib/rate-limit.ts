import { NextResponse } from 'next/server';

const ipRequests = new Map<string, { count: number; lastReset: number }>();

function sweepExpired(windowMs: number) {
  const cutoff = Date.now() - windowMs * 2;
  for (const [ip, record] of ipRequests) {
    if (record.lastReset < cutoff) ipRequests.delete(ip);
  }
}

export function rateLimit(req: Request, limit = 10, windowMs = 60000) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
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
