import dbConnect from '@/lib/db/connect';
import Campaign from '@/models/Campaign';
import CampaignEvent from '@/models/CampaignEvent';

// 1×1 transparent GIF
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/** GET /api/newsletter/open?c=campaignId&s=subscriberHash — open tracking pixel */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('c');
  const emailHash = searchParams.get('s');

  if (campaignId && emailHash) {
    try {
      await dbConnect();
      // Deduplicate: one open event per subscriber per campaign
      const existing = await CampaignEvent.findOne({ campaignId, emailHash, type: 'open' });
      if (!existing) {
        await CampaignEvent.create({ campaignId, emailHash, type: 'open' });
        await Campaign.findByIdAndUpdate(campaignId, { $inc: { openCount: 1 } });
      }
    } catch {
      // Non-fatal — always return the pixel
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
