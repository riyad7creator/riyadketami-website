import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import Campaign from '@/models/Campaign';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { getResend, FROM_EMAIL, escHtml, emailShell } from '@/lib/resend';

interface SendBody {
  subject: string;
  body: string;
  preview?: string;
}

const BATCH_SIZE = 100;
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://riyadketami.com';

function unsubToken(email: string): string {
  // Dedicated secret so rotating the auth secret doesn't invalidate old unsubscribe links.
  const secret = process.env.NEWSLETTER_UNSUB_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
  return createHmac('sha256', secret).update(email.toLowerCase()).digest('hex');
}

function unsubLink(email: string): string {
  return `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken(email)}`;
}

/** Deterministic per-subscriber hash for tracking (SHA-256, not reversible) */
function subscriberHash(email: string, campaignId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? '';
  return createHmac('sha256', secret).update(`${email}:${campaignId}`).digest('hex').slice(0, 16);
}

/** Rewrite all href links in HTML body through the click tracker */
function rewriteLinks(html: string, campaignId: string, emailHash: string): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_, url: string) => {
      const trackUrl = `${APP_URL}/api/newsletter/click?c=${campaignId}&s=${emailHash}&u=${encodeURIComponent(url)}`;
      return `href="${trackUrl}"`;
    }
  );
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

    // Create campaign record upfront to get an ID for tracking
    const campaign = await Campaign.create({
      subject,
      previewText: preview,
      recipientCount: 0,
    });
    const campaignId = (campaign._id as { toString(): string }).toString();

    const subscribers = await Subscriber.find({ unsubscribed: { $ne: true } }).select('email').lean();

    if (subscribers.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No active subscribers to send to.' });
    }

    const emailObjects = (subscribers as { email: string }[]).map(({ email }) => {
      const unsub = unsubLink(email);
      const eHash = subscriberHash(email, campaignId);
      const pixelUrl = `${APP_URL}/api/newsletter/open?c=${campaignId}&s=${eHash}`;

      const rawHtml = `<h2 style="font-size:22px;font-weight:700;color:#f9fafb;margin:0 0 16px;">${escHtml(subject)}</h2>
         ${preview ? `<p style="color:#9ca3af;font-size:13px;margin:0 0 24px;">${escHtml(preview)}</p>` : ''}
         <div style="color:#d1d5db;font-size:15px;line-height:1.7;">${content}</div>
         <hr style="border:none;border-top:1px solid #1f2937;margin:32px 0;" />
         <p style="color:#6b7280;font-size:12px;">
           You received this because you subscribed at riyadketami.com.&nbsp;
           <a href="${unsub}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
         </p>
         <img src="${pixelUrl}" alt="" width="1" height="1" style="display:block;border:0;" />`;

      const htmlWithShell = emailShell('// newsletter', rawHtml);
      // Rewrite links for click tracking (after shell wrapping so wrapper links are also tracked)
      const trackedHtml = rewriteLinks(htmlWithShell, campaignId, eHash);

      return {
        from: `Riyad Ketami <${FROM_EMAIL}>`,
        to: email,
        subject,
        html: trackedHtml,
        headers: {
          'List-Unsubscribe': `<${unsub}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      };
    });

    let sent = 0;
    for (let i = 0; i < emailObjects.length; i += BATCH_SIZE) {
      const batch = emailObjects.slice(i, i + BATCH_SIZE);
      try {
        const result = await resend.batch.send(batch);
        sent += result.data?.data?.length ?? batch.length;
      } catch {
        // Non-fatal — continue remaining batches
      }
    }

    // Update campaign with final recipient count and sent timestamp
    await Campaign.findByIdAndUpdate(campaignId, {
      $set: { sentAt: new Date(), recipientCount: sent },
    });

    return NextResponse.json({ sent, total: emailObjects.length, campaignId });
  } catch (error) {
    return serverError('Failed to send newsletter', error);
  }
}
