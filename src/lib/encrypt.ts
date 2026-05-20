import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length < 64) {
    // Fallback to a deterministic key derived from NEXTAUTH_SECRET when ENCRYPTION_KEY is not set.
    // Not as strong, but prevents hard crashes in dev.
    const secret = process.env.NEXTAUTH_SECRET ?? 'dev-fallback-secret-change-me';
    const { createHash } = require('crypto') as typeof import('crypto');
    return createHash('sha256').update(secret).digest();
  }
  return Buffer.from(hex.slice(0, 64), 'hex');
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv_hex:tag_hex:encrypted_hex
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(stored: string): string {
  const key = getKey();
  const parts = stored.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted value format');
  const iv = Buffer.from(parts[0]!, 'hex');
  const tag = Buffer.from(parts[1]!, 'hex');
  const encrypted = Buffer.from(parts[2]!, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

/** Returns true if the value looks like an encrypted blob (iv:tag:data) */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  return parts.length === 3 && parts[0]!.length === 32 && parts[1]!.length === 32;
}
