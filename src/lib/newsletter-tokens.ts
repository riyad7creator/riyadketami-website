import { createHmac, timingSafeEqual } from 'crypto';

/** Dedicated secret so rotating the auth secret doesn't invalidate old email links. */
function secret(): string {
  return process.env.NEWSLETTER_UNSUB_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
}

function hmacHex(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

/** Constant-time comparison of two hex strings */
export function hexEqual(received: string, expected: string): boolean {
  if (!/^[0-9a-f]+$/i.test(received) || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
}

export function unsubToken(email: string): string {
  return hmacHex(email.toLowerCase());
}

export function verifyUnsubToken(email: string, token: string): boolean {
  return hexEqual(token, unsubToken(email));
}

/** Signature for a tracked click: binds the target URL to its campaign */
export function clickSignature(campaignId: string, url: string): string {
  return hmacHex(`click|${campaignId}|${url}`);
}

export function verifyClickSignature(campaignId: string, url: string, sig: string): boolean {
  return hexEqual(sig, clickSignature(campaignId, url));
}
