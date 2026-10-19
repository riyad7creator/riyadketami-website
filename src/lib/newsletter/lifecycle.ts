/**
 * State changes shared by the public routes, the webhooks and the admin:
 * confirm, unsubscribe, resubscribe. Each one updates MongoDB first, then
 * mirrors to Resend (and Kit when enabled) after the response.
 */
import { after } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber, { type UnsubscribeReason } from '@/models/Subscriber';
import { notifyAdmin } from '@/lib/notify';
import { syncToKit, unsubscribeFromKit } from '@/lib/kit';
import { syncSubscriber } from './esp';
import { sendWelcomeEmail, langOf } from './mail';

const DAY = 24 * 3600 * 1000;

/** Run work after the response when inside a request, inline otherwise (cron, scripts) */
export function later(fn: () => Promise<unknown>): void {
  try {
    after(async () => {
      try { await fn(); } catch (err) { console.error('[newsletter] background task failed:', err); }
    });
  } catch {
    void fn().catch((err) => console.error('[newsletter] background task failed:', err));
  }
}

/** Double opt-in click. Returns the subscriber's language, or null when the address is unknown. */
export async function confirmSubscriber(email: string): Promise<{ lang: 'en' | 'fr' | 'ar'; already: boolean } | null> {
  await dbConnect();
  const sub = await Subscriber.findOne({ email }).lean();
  if (!sub) return null;
  const lang = langOf(sub.preferredLanguage);
  if (sub.confirmed !== false && sub.unsubscribed !== true) return { lang, already: true };

  await Subscriber.updateOne(
    { _id: sub._id },
    {
      $set: { confirmed: true, confirmedAt: new Date(), unsubscribed: false, welcomeStep: 0, welcomeNextAt: new Date() },
      $unset: { unsubscribedAt: '', unsubscribeReason: '', winbackSentAt: '', resendSyncedAt: '' },
    }
  );

  later(async () => {
    const res = await sendWelcomeEmail(email, lang, 1);
    if (res.ok) {
      await Subscriber.updateOne({ email }, { $set: { welcomeStep: 1, welcomeNextAt: new Date(Date.now() + 3 * DAY) } });
    } else {
      console.error('[newsletter] welcome email failed (the daily job retries):', res.error);
    }
  });
  later(() => syncSubscriber(email));
  later(() => syncToKit({ email_address: email }));
  later(() => notifyAdmin({
    type: 'subscriber_new',
    title: 'New subscriber',
    body: `${email} confirmed (${lang.toUpperCase()}${sub.source ? `, ${sub.source}` : ''}).`,
    link: '/rk-studio/newsletter',
  }));
  return { lang, already: false };
}

/** Take someone off the list. Returns false when they were not on it. */
export async function unsubscribeSubscriber(email: string, reason: UnsubscribeReason, opts: { mirror?: boolean } = {}): Promise<boolean> {
  await dbConnect();
  const res = await Subscriber.findOneAndUpdate(
    { email, unsubscribed: { $ne: true } },
    { $set: { unsubscribed: true, unsubscribedAt: new Date(), unsubscribeReason: reason }, $unset: { welcomeNextAt: '' } },
    { new: true }
  );
  if (!res) return false;
  if (opts.mirror !== false) later(() => syncSubscriber(email));
  later(() => unsubscribeFromKit(email));
  return true;
}

/** Back on the list after an own unsubscribe (preference center). Bounces and complaints stay off. */
export async function resubscribe(email: string): Promise<boolean> {
  await dbConnect();
  const res = await Subscriber.findOneAndUpdate(
    { email, unsubscribed: true, confirmed: { $ne: false }, unsubscribeReason: { $nin: ['bounce', 'complaint', 'suppressed'] } },
    { $set: { unsubscribed: false, 'consent.at': new Date(), 'consent.form': 'preferences' }, $unset: { unsubscribedAt: '', unsubscribeReason: '' } },
    { new: true }
  );
  if (!res) return false;
  later(() => syncSubscriber(email));
  later(() => syncToKit({ email_address: email }));
  return true;
}
