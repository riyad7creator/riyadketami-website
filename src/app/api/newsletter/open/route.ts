import dbConnect from '@/lib/db/connect';
import Campaign from '@/models/Campaign';
import CampaignEvent from '@/models/CampaignEvent';
import { rateLimit } from '@/lib/rate-limit';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const SUB_HASH = /^[0-9a-f]{16}$/;

// 1×1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/** GET /api/newsletter/open?c=campaignId&s=subscriberHash: open tracking pixel */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('c') ?? '';
  const emailHash = searchParams.get('s') ?? '';

  // Over the limit or malformed: always answer the pixel, just don't record
  const valid = OBJECT_ID.test(campaignId) && SUB_HASH.test(emailHash);
  const limited = valid ? await rateLimit(req, 60, 60_000, 'nl-track') : null;
  if (valid && !limited) {
    try {
      await dbConnect();
      // Deduplicate: one open event per subscriber per campaign
      const existing = await CampaignEvent.findOne({ campaignId, emailHash, type: 'open' });
      if (!existing) {
        await CampaignEvent.create({ campaignId, emailHash, type: 'open' });
        await Campaign.findByIdAndUpdate(campaignId, { $inc: { openCount: 1 } });
      }
    } catch {
      // Non-fatal: always return the pixel
    }
  }

  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
