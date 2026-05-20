import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Campaign from '@/models/Campaign';
import CampaignEvent from '@/models/CampaignEvent';

/** GET /api/newsletter/click?c=campaignId&s=subscriberHash&u=encodedUrl */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('c');
  const emailHash = searchParams.get('s');
  const encodedUrl = searchParams.get('u');

  const targetUrl = encodedUrl ? decodeURIComponent(encodedUrl) : null;

  // Validate the URL is a real HTTP(S) link to prevent open redirect abuse
  if (targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
  }

  if (campaignId && emailHash) {
    try {
      await dbConnect();
      await CampaignEvent.create({ campaignId, emailHash, type: 'click', url: targetUrl ?? undefined });
      await Campaign.findByIdAndUpdate(campaignId, { $inc: { clickCount: 1 } });
    } catch {
      // Non-fatal
    }
  }

  if (targetUrl) {
    return NextResponse.redirect(targetUrl, { status: 302 });
  }

  return NextResponse.json({ ok: true });
}
