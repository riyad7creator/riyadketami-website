import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getResend, FROM_EMAIL, emailShell } from '@/lib/resend';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { syncToKit } from '@/lib/kit';
import { rateLimit } from '@/lib/rate-limit';
import type { Locale } from '@/i18n/config';

const SOURCES = ['homepage', 'blog-cta', 'links-page', 'import', 'other'] as const;

const schema = z.object({
  email: z.string().email(),
  preferredLanguage: z.enum(['ar', 'en', 'fr']).optional(),
  source: z.enum(SOURCES).optional(),
});

export async function GET() {
  try {
    await dbConnect();
    // Only count active subscribers (exclude those who unsubscribed) so the
    // public number doesn't drift upward from opt-outs.
    const count = await Subscriber.countDocuments({ unsubscribed: { $ne: true } });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(req: Request) {
  const limited = await rateLimit(req, 3, 60_000, 'newsletter-signup');
  if (limited) return limited;

  try {
    const body = await req.json();
    const { email, preferredLanguage, source } = schema.parse(body);

    await dbConnect();

    // Atomic upsert — prevents TOCTOU race where two concurrent signups both pass findOne.
    // A previously-unsubscribed address signing up again is a RE-subscribe: flip the flag
    // back in the same atomic operation so they actually receive emails again.
    const setFields: Record<string, unknown> = { unsubscribed: false };
    if (preferredLanguage) setFields.preferredLanguage = preferredLanguage;

    const before = await Subscriber.findOneAndUpdate(
      { email },
      {
        $setOnInsert: { email, ...(source ? { source } : {}) },
        $set: setFields,
        $unset: { unsubscribedAt: '' },
      },
      { upsert: true, new: false }
    );

    const isNew = before === null;
    const isResubscribe = before !== null && before.unsubscribed === true;

    // Already subscribed and active — nothing more to do (language was updated above)
    if (!isNew && !isResubscribe) {
      return NextResponse.json({ ok: true });
    }

    // Fire-and-forget Kit.com sync — non-fatal, must not block the response.
    // Runs for both new signups and re-subscribes (Kit reactivates on re-create).
    syncToKit({ email_address: email }).catch(() => {});

    // Fire-and-forget admin notification for new subscriber
    if (isNew) {
      fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscriber_new',
          title: 'New subscriber',
          body: `${email} just joined${preferredLanguage ? ` (${preferredLanguage.toUpperCase()})` : ''}.`,
          link: '/admin/newsletter',
        }),
      }).catch(() => {});
    }

    // Fire-and-forget welcome email — only for genuinely new subscribers
    const resend = getResend();
    if (resend && isNew) {
      const p = resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Welcome. You're in. 👋",
        html: emailShell('// welcome to the list', `
          <h2 style="color:#F4F4EF;margin:0 0 16px;font-size:22px;">You're in. Welcome.</h2>
          <p style="color:#9A9A94;line-height:1.7;margin:0 0 16px;">Every week I send one sharp email: AI strategies, business tactics, and creator insights. No filler, no fluff.</p>
          <p style="color:#9A9A94;line-height:1.7;margin:0 0 24px;">If you ever want to work together, <a href="https://riyadketami.com/en/contact" style="color:#00CD29;text-decoration:none;">reach out here</a>.</p>
          <p style="color:#9A9A94;font-size:12px;margin:0;">— Riyad<br/>riyadketami.com</p>
        `),
      });
      p.catch(() => {}); // prevent UnhandledPromiseRejection; failure is non-fatal
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email or language' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
