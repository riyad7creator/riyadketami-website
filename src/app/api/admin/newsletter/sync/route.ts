import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber, { ACTIVE_FILTER } from '@/models/Subscriber';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { espReady, getSegmentIds } from '@/lib/newsletter/esp';
import { syncPending } from '@/lib/newsletter/campaigns';
import { getNewsletterSettings, newsletterFrom } from '@/lib/newsletter/config';
import { turnstileEnabled } from '@/lib/newsletter/turnstile';

export const maxDuration = 300;

/** GET: setup checklist for the newsletter (what is configured, what is missing) */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  try {
    await dbConnect();
    const settings = await getNewsletterSettings();
    const [unsynced, active] = await Promise.all([
      Subscriber.countDocuments({ confirmed: { $ne: false }, resendSyncedAt: { $exists: false } }),
      Subscriber.countDocuments(ACTIVE_FILTER),
    ]);
    let segments: string | null = null;
    if (espReady()) {
      try {
        await getSegmentIds();
        segments = 'ok';
      } catch (err) {
        segments = err instanceof Error ? err.message : 'error';
      }
    }
    return NextResponse.json({
      resendKey: espReady(),
      from: newsletterFrom(),
      dedicatedSender: Boolean(process.env.NEWSLETTER_FROM_EMAIL),
      webhookSecret: Boolean(process.env.RESEND_WEBHOOK_SECRET),
      linkSecret: Boolean(process.env.NEWSLETTER_UNSUB_SECRET),
      cronSecret: Boolean(process.env.CRON_SECRET),
      turnstile: turnstileEnabled(),
      upstash: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      kitMirror: process.env.KIT_SYNC_ENABLED === 'true' && Boolean(process.env.KIT_API_KEY),
      postalAddress: Boolean(settings.postalAddress.trim()),
      segments,
      unsynced,
      active,
    });
  } catch (error) {
    return serverError('Failed to load newsletter status', error);
  }
}

/** POST: push unsynced subscribers to Resend (about 4 minutes per run) */
export async function POST() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  if (!espReady()) return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 });
  try {
    const result = await syncPending(240_000);
    return NextResponse.json(result);
  } catch (error) {
    return serverError('Sync failed', error);
  }
}
