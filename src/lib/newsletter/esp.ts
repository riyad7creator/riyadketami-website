/**
 * Resend as the sending engine: contacts mirror confirmed subscribers, one
 * segment per language, newsletters go out as Broadcasts (not counted against
 * the transactional quota, unsubscribe handled by Resend).
 * MongoDB stays the source of truth; webhooks bring bounces, complaints and
 * unsubscribes back (src/app/api/newsletter/webhooks/resend).
 */
import { getResend } from '@/lib/resend';
import dbConnect from '@/lib/db/connect';
import { getSetting, setSetting } from '@/models/SiteSettings';
import Subscriber from '@/models/Subscriber';
import { NL_LANGS, isNlLang, newsletterFrom, type NlLang } from './config';

const SEGMENTS_KEY = 'newsletter_resend_segments';
const SEGMENT_NAMES: Record<NlLang, string> = {
  en: 'ketami.net newsletter EN',
  fr: 'ketami.net newsletter FR',
  ar: 'ketami.net newsletter AR',
};

/** Resend's default API limit is a few requests per second: keep calls spaced out */
const MIN_GAP_MS = 550;
let nextSlot = 0;
async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + MIN_GAP_MS;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

type ApiResult<T> = { data: T; error: null } | { data: null; error: { message: string; statusCode: number | null; name: string } };

/** One Resend call, spaced out, retried once after a rate-limit answer */
async function call<T>(fn: () => Promise<ApiResult<T>>): Promise<ApiResult<T>> {
  await throttle();
  let res = await fn();
  if (res.error && (res.error.statusCode === 429 || res.error.name === 'rate_limit_exceeded')) {
    await new Promise((r) => setTimeout(r, 1500));
    await throttle();
    res = await fn();
  }
  return res;
}

export function espReady(): boolean {
  return getResend() !== null;
}

function client() {
  const resend = getResend();
  if (!resend) throw new Error('RESEND_API_KEY is not configured');
  return resend;
}

let segmentCache: Record<NlLang, string> | null = null;

/** Segment id per language, created in Resend on first use and remembered */
export async function getSegmentIds(): Promise<Record<NlLang, string>> {
  if (segmentCache) return segmentCache;
  const resend = client();
  await dbConnect();
  const saved = (await getSetting<Partial<Record<NlLang, string>>>(SEGMENTS_KEY)) ?? {};
  const out = {} as Record<NlLang, string>;
  let existing: { id: string; name: string }[] | null = null;
  for (const lang of NL_LANGS) {
    const known = saved[lang];
    if (known) {
      out[lang] = known;
      continue;
    }
    if (!existing) {
      const list = await call(() => resend.segments.list());
      if (list.error) throw new Error(`Resend segments: ${list.error.message}`);
      existing = list.data.data;
    }
    const found = existing.find((s) => s.name === SEGMENT_NAMES[lang]);
    if (found) {
      out[lang] = found.id;
    } else {
      const created = await call(() => resend.segments.create({ name: SEGMENT_NAMES[lang] }));
      if (created.error) throw new Error(`Resend segment create: ${created.error.message}`);
      out[lang] = created.data.id;
    }
  }
  await setSetting(SEGMENTS_KEY, out);
  segmentCache = out;
  return out;
}

/**
 * Create or update the Resend contact for one subscriber: subscribed only when
 * active, member of exactly one language segment (no language = English).
 */
export async function upsertContact(sub: { email: string; preferredLanguage?: string | null; active: boolean }): Promise<void> {
  const resend = client();
  const segments = await getSegmentIds();
  const lang: NlLang = isNlLang(sub.preferredLanguage) ? sub.preferredLanguage : 'en';
  const target = segments[lang];
  const email = sub.email.toLowerCase();

  const found = await call(() => resend.contacts.get({ email }));
  if (found.error && found.error.statusCode !== 404 && found.error.name !== 'not_found') {
    throw new Error(`Resend contact lookup: ${found.error.message}`);
  }

  if (!found.data) {
    const created = await call(() => resend.contacts.create({ email, unsubscribed: !sub.active, segments: [{ id: target }] }));
    if (created.error) throw new Error(`Resend contact create: ${created.error.message}`);
    return;
  }

  const updated = await call(() => resend.contacts.update({ email, unsubscribed: !sub.active }));
  if (updated.error) throw new Error(`Resend contact update: ${updated.error.message}`);

  const memberships = await call(() => resend.contacts.segments.list({ email }));
  if (memberships.error) throw new Error(`Resend contact segments: ${memberships.error.message}`);
  const current = memberships.data.data.map((s) => s.id);
  const ours = Object.values(segments);
  for (const id of current) {
    if (ours.includes(id) && id !== target) {
      const removed = await call(() => resend.contacts.segments.remove({ email, segmentId: id }));
      if (removed.error) throw new Error(`Resend segment remove: ${removed.error.message}`);
    }
  }
  if (!current.includes(target)) {
    const added = await call(() => resend.contacts.segments.add({ email, segmentId: target }));
    if (added.error) throw new Error(`Resend segment add: ${added.error.message}`);
  }
}

export async function removeContact(email: string): Promise<void> {
  const resend = client();
  const res = await call(() => resend.contacts.remove({ email: email.toLowerCase() }));
  if (res.error && res.error.statusCode !== 404 && res.error.name !== 'not_found') {
    throw new Error(`Resend contact delete: ${res.error.message}`);
  }
}

/**
 * Mirror one subscriber row to Resend and stamp resendSyncedAt. Never throws:
 * a failed sync leaves the stamp empty so the next sync run retries it.
 */
export async function syncSubscriber(email: string): Promise<boolean> {
  if (!espReady()) return false;
  try {
    await dbConnect();
    const sub = await Subscriber.findOne({ email: email.toLowerCase() }).lean();
    if (!sub) {
      await removeContact(email);
      return true;
    }
    const active = sub.unsubscribed !== true && sub.confirmed !== false;
    // Pending people are never pushed to Resend: nothing to send them yet
    if (sub.confirmed === false) return true;
    await upsertContact({ email: sub.email, preferredLanguage: sub.preferredLanguage, active });
    await Subscriber.updateOne({ _id: sub._id }, { $set: { resendSyncedAt: new Date() } });
    return true;
  } catch (err) {
    console.error('[newsletter] Resend sync failed:', err instanceof Error ? err.message : err);
    await Subscriber.updateOne({ email: email.toLowerCase() }, { $unset: { resendSyncedAt: '' } }).catch(() => {});
    return false;
  }
}

export interface BroadcastInput {
  segmentId: string;
  name: string;
  subject: string;
  previewText?: string;
  html: string;
  text: string;
  replyTo?: string;
  scheduledAt?: Date;
}

/** Create and send (or schedule) one broadcast. Returns its id. */
export async function sendBroadcast(b: BroadcastInput): Promise<string> {
  const resend = client();
  const res = await call(() =>
    resend.broadcasts.create({
      segmentId: b.segmentId,
      name: b.name.slice(0, 120),
      from: newsletterFrom(),
      subject: b.subject,
      ...(b.previewText ? { previewText: b.previewText } : {}),
      ...(b.replyTo ? { replyTo: b.replyTo } : {}),
      html: b.html,
      text: b.text,
      send: true,
      ...(b.scheduledAt ? { scheduledAt: b.scheduledAt.toISOString() } : {}),
    })
  );
  if (res.error) throw new Error(res.error.message);
  return res.data.id;
}

/** Placeholder Resend swaps for each contact's own unsubscribe link */
export const RESEND_UNSUBSCRIBE_PLACEHOLDER = '{{{RESEND_UNSUBSCRIBE_URL}}}';
