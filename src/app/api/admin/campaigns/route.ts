import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Campaign from '@/models/Campaign';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, serverError } from '@/lib/api-helpers';

/** GET /api/admin/campaigns — list campaigns with stats + subscriber growth */
export async function GET(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') ?? 'campaigns';

    if (mode === 'growth') {
      // Subscriber growth: daily new subscribers for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const growth = await Subscriber.aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const sourceSplit = await Subscriber.aggregate<{ _id: string | null; count: number }>([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return NextResponse.json({ growth, sourceSplit });
    }

    // Default: list recent campaigns
    const campaigns = await Campaign.find({ sentAt: { $exists: true } })
      .sort({ sentAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ campaigns });
  } catch (error) {
    return serverError('Failed to fetch campaigns', error);
  }
}
