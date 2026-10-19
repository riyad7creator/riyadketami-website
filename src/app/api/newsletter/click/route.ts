import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Campaign from '@/models/Campaign';
import CampaignEvent from '@/models/CampaignEvent';
import { rateLimit } from '@/lib/rate-limit';
import { verifyClickSignature } from '@/lib/newsletter-tokens';

const APP_URL = process.env.NEXTAUTH_URL ?? 'https://ketami.net';
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const SUB_HASH = /^[0-9a-f]{16}$/;

/**
 * GET /api/newsletter/click?c=campaignId&s=subscriberHash&u=url&k=signature
 * Redirects only to URLs signed for that campaign at send time (HMAC over
 * campaignId|url), so the endpoint cannot be used as an open redirect.
 * Anything unsigned or malformed goes to the site home.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('c') ?? '';
  const emailHash = searchParams.get('s') ?? '';
  // searchParams already decodes; decoding again threw URIError on "%" in URLs
  const targetUrl = searchParams.get('u') ?? '';
  const sig = searchParams.get('k') ?? '';

  const home = NextResponse.redirect(new URL('/', APP_URL), { status: 302 });

  if (!OBJECT_ID.test(campaignId) || !targetUrl || !sig) return home;
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return home;
  } catch {
    return home;
  }
  if (!verifyClickSignature(campaignId, targetUrl, sig)) return home;

  // Over the limit: still send the reader on, just don't count the click
  const limited = await rateLimit(req, 60, 60_000, 'nl-track');
  if (!limited && SUB_HASH.test(emailHash)) {
    try {
      await dbConnect();
      await CampaignEvent.create({ campaignId, emailHash, type: 'click', url: targetUrl });
      await Campaign.findByIdAndUpdate(campaignId, { $inc: { clickCount: 1 } });
    } catch {
      // Non-fatal
    }
  }

  return NextResponse.redirect(targetUrl, { status: 302 });
}
