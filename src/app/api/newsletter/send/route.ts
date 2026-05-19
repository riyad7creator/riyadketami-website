import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { getResend, FROM_EMAIL, escHtml, emailShell } from '@/lib/resend';

interface SendBody {
  subject: string;
  body: string; // HTML content
  preview?: string;
}

const BATCH_SIZE = 100; // Resend batch API limit

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://riyadketami.com';

/** Deterministic per-email unsubscribe token (HMAC — no DB storage needed) */
function unsubToken(email: string): string {
  // Dedicated secret so rotating the auth secret doesn't invalidate old unsubscribe links.
  const secret = process.env.NEWSLETTER_UNSUB_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
  return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
}

function unsubLink(email: string): string {
  return `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken(email)}`;
}

export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const body = await req.json() as Partial<SendBody>;
    const { subject, body: content, preview } = body;

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'subject and body are required' }, { status: 400 });
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 });
    }

    await dbConnect();
    // Exclude unsubscribed subscribers
    const subscribers = await Subscriber.find({ unsubscribed: { $ne: true } }).select('email').lean();

    if (subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No active subscribers to send to.' });
    }

    // Build one email object per subscriber with a personalised unsubscribe link
    const emailObjects = (subscribers as { email: string }[]).map(({ email }) => {
      const unsub = unsubLink(email);
      const html = emailShell(
        '// newsletter',
        `<h2 style="font-size:22px;font-weight:700;color:#f9fafb;margin:0 0 16px;">${escHtml(subject)}</h2>
         ${preview ? `<p style="color:#9ca3af;font-size:13px;margin:0 0 24px;">${escHtml(preview)}</p>` : ''}
         <div style="color:#d1d5db;font-size:15px;line-height:1.7;">${content}</div>
         <hr style="border:none;border-top:1px solid #1f2937;margin:32px 0;" />
         <p style="color:#6b7280;font-size:12px;">
           You received this because you subscribed at riyadketami.com.&nbsp;
           <a href="${unsub}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
         </p>`
      );

      return {
        from: `Riyad Ketami <${FROM_EMAIL}>`,
        to: email,
        subject,
        html,
        headers: {
          'List-Unsubscribe': `<${unsub}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    });

    // Use Resend batch API — one HTTP request per 100 emails
    let sent = 0;
    for (let i = 0; i < emailObjects.length; i += BATCH_SIZE) {
      const batch = emailObjects.slice(i, i + BATCH_SIZE);
      try {
        const result = await resend.batch.send(batch);
        sent += result.data?.data?.length ?? batch.length;
      } catch {
        // Count as 0 for this batch — do not abort remaining batches
      }
    }

    return NextResponse.json({ sent, total: emailObjects.length });
  } catch (error) {
    return serverError('Failed to send newsletter', error);
  }
}
