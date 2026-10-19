/**
 * SSRF guards for server-side fetches of admin-supplied URLs (RSS feeds).
 * isPublicHttpsUrlSync() is a pure syntax check (safe in zod schemas and the
 * browser); assertPublicHttpsUrl() also resolves DNS and checks every address.
 */

const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home', '.corp', '.intranet'];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

function inRange(ip: number, base: string, bits: number): boolean {
  const b = ipv4ToInt(base)!;
  const size = 2 ** (32 - bits);
  return ip >= b && ip < b + size;
}

const PRIVATE_V4: [string, number][] = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
  ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
];

/** True for loopback, private, link-local, CGNAT, multicast and reserved addresses (v4 and v6). */
export function isPrivateIp(ip: string): boolean {
  const addr = ip.trim().toLowerCase().replace(/^\[|\]$/g, '');
  const v4 = ipv4ToInt(addr);
  if (v4 !== null) return PRIVATE_V4.some(([base, bits]) => inRange(v4, base, bits));
  if (!addr.includes(':')) return false;
  // IPv4-mapped / translated (::ffff:a.b.c.d)
  const mapped = addr.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped?.[1] && (addr.startsWith('::ffff:') || addr.startsWith('64:ff9b:'))) return isPrivateIp(mapped[1]);
  if (addr === '::' || addr === '::1') return true;
  const first = parseInt(addr.split(':')[0] || '0', 16);
  if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  return false;
}

function isBlockedHostname(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  if (!h || h === 'localhost' || (!h.includes('.') && !h.includes(':'))) return true;
  if (BLOCKED_HOST_SUFFIXES.some((s) => h.endsWith(s))) return true;
  return isPrivateIp(h);
}

/** Syntax-only: https URL whose host is not localhost / a private IP literal. */
export function isPublicHttpsUrlSync(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    return !isBlockedHostname(url.hostname);
  } catch {
    return false;
  }
}

/** Full check: syntax plus DNS resolution (every resolved address must be public). */
export async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  if (!isPublicHttpsUrlSync(raw)) throw new Error('URL must be a public https:// address');
  const url = new URL(raw);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (ipv4ToInt(host) !== null || host.includes(':')) return url; // literal already checked
  const { lookup } = await import('node:dns/promises');
  const addrs = await lookup(host, { all: true, verbatim: true });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error('URL resolves to a private or local address');
  }
  return url;
}
