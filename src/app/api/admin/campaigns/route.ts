import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, serverError } from '@/lib/api-helpers';

/** GET ?mode=growth: confirmed signups per day (30 days) and active subscribers by source */
export async function GET() {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;
    await dbConnect();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const growth = await Subscriber.aggregate<{ _id: string; count: number }>([
      { $match: { confirmed: { $ne: false }, $or: [{ confirmedAt: { $gte: thirtyDaysAgo } }, { confirmedAt: { $exists: false }, createdAt: { $gte: thirtyDaysAgo } }] } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$confirmedAt', '$createdAt'] } } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const sourceSplit = await Subscriber.aggregate<{ _id: string | null; count: number }>([
      { $match: { confirmed: { $ne: false }, unsubscribed: { $ne: true } } },
      { $group: { _id: { $ifNull: ['$utm.source', '$source'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return NextResponse.json({ growth, sourceSplit });
  } catch (error) {
    return serverError('Failed to fetch growth', error);
  }
}
