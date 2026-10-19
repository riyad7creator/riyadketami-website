import { createHmac } from 'crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import Campaign from '@/models/Campaign';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { getResend, FROM_EMAIL, escHtml, emailShell } from '@/lib/resend';
import { unsubToken, clickSignature } from '@/lib/newsletter-tokens';
import { notifyAdmin } from '@/lib/notify';

// Large lists are sent in batches of 100: give the function room to finish
export const maxDuration = 300;

interface SendBody {
  subject: string;
  body: string;
  preview?: string;
  idempotencyKey?: string;
}

const BATCH_SIZE = 100;
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://ketami.net';
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,100}$/;

function unsubLink(email: string): string {
  return `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubToken(email)}`;
}

/** Deterministic per-subscriber hash for tracking (SHA-256, not reversible) */
function subscriberHash(email: string, campaignId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? '';
  return createHmac('sha256', secret).update(`${email}:${campaignId}`).digest('hex').slice(0, 16);
}

/** Rewrite all href links in HTML body through the (signed) click tracker */
function rewriteLinks(html: string, campaignId: string, emailHash: string): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_, rawUrl: string) => {
      // The attribute value is HTML-escaped; sign and redirect to the real URL
      const url = rawUrl.replace(/&amp;/g, '&');
      const sig = clickSignature(campaignId, url);
      const trackUrl = `${APP_URL}/api/newsletter/click?c=${campaignId}&s=${emailHash}&u=${encodeURIComponent(url)}&k=${sig}`;
      return `href="${escHtml(trackUrl)}"`;
    }
  );
}

export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const body = await readJson<Partial<SendBody>>(req);
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const content = typeof body?.body === 'string' ? body.body : '';
    const preview = typeof body?.preview === 'string' ? body.preview.trim() : '';
    const idempotencyKey = typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : undefined;

    if (!subject || !content.trim()) {
      return NextResponse.json({ error: 'subject and body are required' }, { status: 400 });
    }
    if (idempotencyKey !== undefined && !IDEMPOTENCY_KEY.test(idempotencyKey)) {
      return NextResponse.json({ error: 'Invalid idempotencyKey' }, { status: 400 });
    }

    await dbConnect();

    // A double click / retry of the same send must never email the list twice
    if (idempotencyKey && (await Campaign.exists({ idempotencyKey }))) {
      return NextResponse.json({ error: 'This newsletter was already sent (duplicate request).' }, { status: 409 });
    }

    const subscribers = await Subscriber.find({ unsubscribed: { $ne: true } }).select('email').lean();

    // No campaign record for a send that reaches nobody
    if (subscribers.length === 0) {
      return NextResponse.json({ sent: 0, total: 0, message: 'No active subscribers to send to.' });
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 });
    }

    // Create the campaign record now to get an ID for tracking
    let campaign;
    try {
      campaign = await Campaign.create({
        subject,
        previewText: preview || undefined,
        recipientCount: 0,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      });
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) {
        return NextResponse.json({ error: 'This newsletter was already sent (duplicate request).' }, { status: 409 });
      }
      throw error;
    }
    const campaignId = (campaign._id as { toString(): string }).toString();

    const emailObjects = (subscribers as { email: string }[]).map(({ email }) => {
      const unsub = unsubLink(email);
      const eHash = subscriberHash(email, campaignId);
      const pixelUrl = `${APP_URL}/api/newsletter/open?c=${campaignId}&s=${eHash}`;

      const rawHtml = `<h2 style="font-size:22px;font-weight:700;color:#F4F4EF;margin:0 0 16px;">${escHtml(subject)}</h2>
         ${preview ? `<p style="color:#9A9A94;font-size:13px;margin:0 0 24px;">${escHtml(preview)}</p>` : ''}
         <div style="color:#C6C6C0;font-size:15px;line-height:1.7;">${content}</div>
         <hr style="border:none;border-top:1px solid #2A2A28;margin:32px 0;" />
         <p style="color:#9A9A94;font-size:12px;">
           You received this because you subscribed at ketami.net.&nbsp;
           <a href="${escHtml(unsub)}" style="color:#9A9A94;text-decoration:underline;">Unsubscribe</a>
         </p>
         <img src="${escHtml(pixelUrl)}" alt="" width="1" height="1" style="display:block;border:0;" />`;

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
    let failed = 0;
    let lastError = '';
    for (let i = 0; i < emailObjects.length; i += BATCH_SIZE) {
      const batch = emailObjects.slice(i, i + BATCH_SIZE);
      try {
        const result = await resend.batch.send(batch);
        // Resend reports API errors in the result instead of throwing
        if (result.error) {
          failed += batch.length;
          lastError = result.error.message ?? 'Resend error';
          continue;
        }
        const accepted = Math.min(result.data?.data?.length ?? 0, batch.length);
        sent += accepted;
        failed += batch.length - accepted;
      } catch (err) {
        failed += batch.length;
        lastError = err instanceof Error ? err.message : 'Send failed';
      }
    }

    // Update campaign with final recipient count and sent timestamp
    await Campaign.findByIdAndUpdate(campaignId, {
      $set: { sentAt: new Date(), recipientCount: sent, failedCount: failed },
    });

    if (failed > 0) {
      void notifyAdmin({
        type: 'send_failure',
        title: 'Newsletter send had failures',
        body: `"${subject}": ${sent} sent, ${failed} failed.${lastError ? ` Last error: ${lastError}` : ''}`.slice(0, 1400),
        link: '/rk-studio/newsletter',
      });
    }

    const status = sent === 0 ? 502 : 200;
    return NextResponse.json(
      { sent, failed, total: emailObjects.length, campaignId, ...(sent === 0 ? { error: `Send failed: ${lastError || 'no email was accepted'}` } : {}) },
      { status }
    );
  } catch (error) {
    return serverError('Failed to send newsletter', error);
  }
}
