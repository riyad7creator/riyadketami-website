import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { rateLimit, hitLimit } from '@/lib/rate-limit';
import { readJson, InvalidJsonError, badJson } from '@/lib/api-helpers';
import { verifyUnsubToken } from '@/lib/newsletter-tokens';
import { sendManageLinkEmail, langOf } from '@/lib/newsletter/mail';
import { later, unsubscribeSubscriber, resubscribe } from '@/lib/newsletter/lifecycle';
import { syncSubscriber } from '@/lib/newsletter/esp';

const requestSchema = z.object({
  action: z.literal('request'),
  email: z.string().trim().toLowerCase().email().max(254),
  lang: z.enum(['en', 'fr', 'ar']).optional(),
});

const updateSchema = z.object({
  action: z.literal('update'),
  email: z.string().trim().toLowerCase().email().max(254),
  token: z.string().min(16).max(128),
  preferredLanguage: z.enum(['en', 'fr', 'ar']).optional(),
  subscribed: z.boolean().optional(),
});

/**
 * POST /api/newsletter/preferences
 * - { action: 'request', email }: email a personal settings link (same answer either way)
 * - { action: 'update', email, token, preferredLanguage?, subscribed? }: apply changes
 */
export async function POST(req: Request) {
  const limited = await rateLimit(req, 10, 60_000, 'newsletter-prefs');
  if (limited) return limited;
  try {
    const body = await readJson<{ action?: string }>(req);

    if (body?.action === 'request') {
      const parsed = requestSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
      const { email } = parsed.data;
      await dbConnect();
      const sub = await Subscriber.findOne({ email }).select('preferredLanguage confirmed').lean();
      if (sub && sub.confirmed !== false && !(await hitLimit(email, 2, 3600_000, 'newsletter-manage-link'))) {
        const lang = langOf(sub.preferredLanguage ?? parsed.data.lang);
        later(async () => {
          const res = await sendManageLinkEmail(email, lang);
          if (!res.ok) console.error('[newsletter] manage link failed:', res.error);
        });
      }
      return NextResponse.json({ ok: true });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const { email, token, preferredLanguage, subscribed } = parsed.data;
    if (!verifyUnsubToken(email, token)) return NextResponse.json({ error: 'Invalid link' }, { status: 403 });

    await dbConnect();
    const sub = await Subscriber.findOne({ email }).lean();
    if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (preferredLanguage && preferredLanguage !== sub.preferredLanguage) {
      await Subscriber.updateOne({ _id: sub._id }, { $set: { preferredLanguage } });
      later(() => syncSubscriber(email));
    }
    let resubscribeRefused = false;
    if (subscribed === false) await unsubscribeSubscriber(email, 'user');
    if (subscribed === true && sub.unsubscribed) resubscribeRefused = !(await resubscribe(email));

    const fresh = await Subscriber.findOne({ email }).select('preferredLanguage unsubscribed').lean();
    return NextResponse.json({
      ok: true,
      preferredLanguage: fresh?.preferredLanguage ?? null,
      subscribed: fresh ? !fresh.unsubscribed : false,
      ...(resubscribeRefused ? { error: 'This address bounced or reported spam, so it cannot be re-added here.' } : {}),
    });
  } catch (err) {
    if (err instanceof InvalidJsonError) return badJson();
    console.error('[newsletter] preferences failed:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
