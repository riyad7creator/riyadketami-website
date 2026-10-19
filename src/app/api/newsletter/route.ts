import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import Subscriber, { ACTIVE_FILTER, SUBSCRIBER_SOURCES } from '@/models/Subscriber';
import { rateLimit, clientIp, hitLimit } from '@/lib/rate-limit';
import { readJson, InvalidJsonError, badJson, requireAdmin } from '@/lib/api-helpers';
import { verifyTurnstile } from '@/lib/newsletter/turnstile';
import { sendConfirmEmail, langOf } from '@/lib/newsletter/mail';
import { CONSENT_TEXT_VERSION } from '@/lib/newsletter/config';

const utmField = z.string().trim().max(120).optional();

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  preferredLanguage: z.enum(['ar', 'en', 'fr']).optional(),
  source: z.enum(SUBSCRIBER_SOURCES).optional(),
  utm: z.object({ source: utmField, medium: utmField, campaign: utmField }).optional(),
  /** Must be ticked: the consent checkbox under the form */
  consent: z.literal(true),
  /** Honeypot: humans never see or fill this field */
  company: z.string().max(200).optional(),
  /** When the form was shown (ms). Submissions under 2 seconds are bots. */
  startedAt: z.number().int().positive().optional(),
  turnstileToken: z.string().max(4096).optional(),
});

/** The same answer for every outcome, so the form never reveals who is subscribed */
const ACCEPTED = () => NextResponse.json({ ok: true, pending: true }, { status: 202 });

/** GET /api/newsletter: active subscriber count, admin only (never shown publicly) */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  await dbConnect();
  const count = await Subscriber.countDocuments(ACTIVE_FILTER);
  return NextResponse.json({ count });
}

/**
 * POST /api/newsletter: double opt-in signup. Stores the consent record and
 * sends a confirmation email; the address only joins the list after the click.
 */
export async function POST(req: Request) {
  const limited = await rateLimit(req, 5, 60_000, 'newsletter-signup');
  if (limited) return limited;

  try {
    const body = await readJson(req);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email, language or consent' }, { status: 400 });
    }
    const { email, preferredLanguage, source, utm, company, startedAt, turnstileToken } = parsed.data;

    // Bots: filled honeypot or impossibly fast submit. Answer as if accepted.
    if (company && company.trim()) return ACCEPTED();
    if (startedAt && Date.now() - startedAt < 2000) return ACCEPTED();

    const ip = clientIp(req);
    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 400 });
    }

    await dbConnect();
    const existing = await Subscriber.findOne({ email }).lean();

    // Already on the list: only refresh the language, send nothing
    if (existing && existing.confirmed !== false && existing.unsubscribed !== true) {
      if (preferredLanguage && preferredLanguage !== existing.preferredLanguage) {
        await Subscriber.updateOne({ _id: existing._id }, { $set: { preferredLanguage } });
        after(async () => {
          const { syncSubscriber } = await import('@/lib/newsletter/esp');
          await syncSubscriber(email);
        });
      }
      return ACCEPTED();
    }

    // One confirmation email per address per 10 minutes, whatever the IP
    const recent = existing?.confirmSentAt && Date.now() - new Date(existing.confirmSentAt).getTime() < 10 * 60_000;
    if (recent || (await hitLimit(email, 1, 10 * 60_000, 'newsletter-confirm'))) return ACCEPTED();

    const lang = langOf(preferredLanguage);
    const consent = {
      at: new Date(),
      ip: ip.slice(0, 64),
      userAgent: (req.headers.get('user-agent') ?? '').slice(0, 300),
      form: source ?? 'other',
      textVersion: CONSENT_TEXT_VERSION,
      language: lang,
    };

    await Subscriber.updateOne(
      { email },
      {
        $setOnInsert: { email, unsubscribed: false, ...(source ? { source } : {}), ...(utm ? { utm } : {}) },
        $set: { confirmed: false, consent, confirmSentAt: new Date(), ...(preferredLanguage ? { preferredLanguage } : {}) },
      },
      { upsert: true }
    );

    after(async () => {
      const res = await sendConfirmEmail(email, lang);
      if (!res.ok) console.error('[newsletter] confirmation email failed:', res.error);
    });

    return ACCEPTED();
  } catch (err) {
    if (err instanceof InvalidJsonError) return badJson();
    console.error('[newsletter] signup failed:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
