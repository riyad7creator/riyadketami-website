import { NextResponse } from 'next/server';
import type { WebhookEventPayload } from 'resend';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import Campaign from '@/models/Campaign';
import CampaignEvent from '@/models/CampaignEvent';
import WebhookEvent from '@/models/WebhookEvent';
import { getResend } from '@/lib/resend';
import { subscriberHash } from '@/lib/newsletter-tokens';
import { unsubscribeSubscriber } from '@/lib/newsletter/lifecycle';
import { notifyAdmin } from '@/lib/notify';

export const maxDuration = 30;

/**
 * POST /api/newsletter/webhooks/resend
 * Point a Resend webhook here (Dashboard > Webhooks) with the events
 * email.bounced, email.complained, email.suppressed, email.delivered,
 * email.opened, email.clicked and contact.updated, and put its signing secret
 * in RESEND_WEBHOOK_SECRET.
 *
 * - Hard bounces, complaints, suppressions and Resend unsubscribes take the
 *   address off the list in MongoDB.
 * - Broadcast opens, clicks and deliveries update the campaign's numbers.
 */
export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const resend = getResend();
  if (!secret || !resend) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });

  const payload = await req.text();
  const id = req.headers.get('svix-id') ?? '';
  const timestamp = req.headers.get('svix-timestamp') ?? '';
  const signature = req.headers.get('svix-signature') ?? '';

  let event: WebhookEventPayload;
  try {
    event = resend.webhooks.verify({ payload, headers: { id, timestamp, signature }, webhookSecret: secret });
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  await dbConnect();

  // Retries keep the same svix-id: apply each delivery once
  try {
    await WebhookEvent.create({ _id: id, type: event.type });
  } catch (err) {
    if ((err as { code?: number })?.code === 11000) return NextResponse.json({ ok: true, duplicate: true });
    throw err;
  }

  try {
    await handle(event);
  } catch (err) {
    // Let Resend retry: forget the delivery id
    await WebhookEvent.deleteOne({ _id: id }).catch(() => {});
    console.error('[newsletter] webhook failed:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

async function campaignFor(broadcastId?: string): Promise<string | null> {
  if (!broadcastId) return null;
  const c = await Campaign.findOne({ 'editions.resendBroadcastId': broadcastId }).select('_id').lean();
  return c ? String(c._id) : null;
}

async function handle(event: WebhookEventPayload): Promise<void> {
  switch (event.type) {
    case 'email.bounced': {
      // Only permanent bounces leave the list; temporary ones retry on their own
      const kind = `${event.data.bounce?.type ?? ''} ${event.data.bounce?.subType ?? ''}`;
      const permanent = !/transient|temporary|soft/i.test(kind);
      const campaignId = await campaignFor(event.data.broadcast_id);
      if (campaignId) await Campaign.updateOne({ _id: campaignId }, { $inc: { bounceCount: 1 } });
      if (permanent) for (const to of event.data.to) await unsubscribeSubscriber(to.toLowerCase(), 'bounce');
      return;
    }
    case 'email.complained': {
      const campaignId = await campaignFor(event.data.broadcast_id);
      if (campaignId) await Campaign.updateOne({ _id: campaignId }, { $inc: { complaintCount: 1 } });
      for (const to of event.data.to) await unsubscribeSubscriber(to.toLowerCase(), 'complaint');
      void notifyAdmin({
        type: 'send_failure',
        title: 'Spam complaint',
        body: `${event.data.to.join(', ')} marked "${event.data.subject}" as spam and was removed from the list.`,
        link: '/rk-studio/newsletter',
      });
      return;
    }
    case 'email.suppressed': {
      for (const to of event.data.to) await unsubscribeSubscriber(to.toLowerCase(), 'suppressed');
      return;
    }
    case 'contact.updated': {
      // Someone used Resend's unsubscribe link in a broadcast
      if (event.data.unsubscribed) await unsubscribeSubscriber(event.data.email.toLowerCase(), 'user', { mirror: false });
      return;
    }
    case 'email.delivered': {
      const campaignId = await campaignFor(event.data.broadcast_id);
      if (campaignId) await Campaign.updateOne({ _id: campaignId }, { $inc: { deliveredCount: 1 } });
      return;
    }
    case 'email.opened':
    case 'email.clicked': {
      const isClick = event.type === 'email.clicked';
      const to = (event.data.to[0] ?? '').toLowerCase();
      if (isClick && to) await Subscriber.updateOne({ email: to }, { $set: { lastClickAt: new Date() }, $unset: { winbackSentAt: '' } });
      const campaignId = await campaignFor(event.data.broadcast_id);
      if (!campaignId || !to) return;
      const emailHash = subscriberHash(to, campaignId);
      const type = isClick ? 'click' : 'open';
      const first = !(await CampaignEvent.exists({ campaignId, type, emailHash }));
      await CampaignEvent.create({
        campaignId,
        type,
        emailHash,
        ...(event.type === 'email.clicked' ? { url: event.data.click?.link?.slice(0, 2000) } : {}),
      });
      await Campaign.updateOne(
        { _id: campaignId },
        { $inc: isClick ? { clickCount: 1, ...(first ? { uniqueClickCount: 1 } : {}) } : { openCount: 1, ...(first ? { uniqueOpenCount: 1 } : {}) } }
      );
      return;
    }
    default:
      return;
  }
}
