import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Dedicated secret so rotating the auth secret doesn't invalidate old email links.
 * Throws when neither secret is set: an empty HMAC key would let anyone forge
 * unsubscribe, confirm and click links.
 */
function secret(): string {
  const s = process.env.NEWSLETTER_UNSUB_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!s) throw new Error('NEWSLETTER_UNSUB_SECRET (or NEXTAUTH_SECRET) must be set for newsletter links');
  return s;
}

function hmacHex(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

/** Constant-time comparison of two hex strings */
export function hexEqual(received: string, expected: string): boolean {
  if (!/^[0-9a-f]+$/i.test(received) || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
}

/** Long-lived token for unsubscribe and the preference center */
export function unsubToken(email: string): string {
  return hmacHex(email.toLowerCase());
}

export function verifyUnsubToken(email: string, token: string): boolean {
  return hexEqual(token, unsubToken(email));
}

const CONFIRM_TTL_MS = 7 * 24 * 3600 * 1000;

/** Double opt-in token: `<issuedAtMs>.<hmac>`, valid for 7 days */
export function confirmToken(email: string, issuedAt = Date.now()): string {
  return `${issuedAt}.${hmacHex(`confirm|${email.toLowerCase()}|${issuedAt}`)}`;
}

export function verifyConfirmToken(email: string, token: string): boolean {
  const [ts, sig] = token.split('.');
  const issuedAt = Number(ts);
  if (!Number.isFinite(issuedAt) || !sig) return false;
  if (Date.now() - issuedAt > CONFIRM_TTL_MS || issuedAt > Date.now() + 60_000) return false;
  return hexEqual(sig, hmacHex(`confirm|${email.toLowerCase()}|${issuedAt}`));
}

/** Short per-recipient hash for engagement events (not reversible) */
export function subscriberHash(email: string, campaignId: string): string {
  return hmacHex(`sub|${email.toLowerCase()}|${campaignId}`).slice(0, 16);
}

/** Signature for a tracked click: binds the target URL to its campaign */
export function clickSignature(campaignId: string, url: string): string {
  return hmacHex(`click|${campaignId}|${url}`);
}

export function verifyClickSignature(campaignId: string, url: string, sig: string): boolean {
  return hexEqual(sig, clickSignature(campaignId, url));
}
