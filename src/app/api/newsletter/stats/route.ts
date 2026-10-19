import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber, { ACTIVE_FILTER, PENDING_FILTER } from '@/models/Subscriber';
import { requireAdmin, serverError } from '@/lib/api-helpers';

/** GET: audience numbers for the studio (active, pending, unsubscribed by reason) */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    await dbConnect();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const [total, byLanguage, recentCount, pending, unsubscribedRows] = await Promise.all([
      Subscriber.countDocuments(ACTIVE_FILTER),
      Subscriber.aggregate<{ _id: string | null; count: number }>([
        { $match: ACTIVE_FILTER },
        { $group: { _id: '$preferredLanguage', count: { $sum: 1 } } },
      ]),
      Subscriber.countDocuments({
        ...ACTIVE_FILTER,
        $or: [{ confirmedAt: { $gte: sevenDaysAgo } }, { confirmedAt: { $exists: false }, createdAt: { $gte: sevenDaysAgo } }],
      }),
      Subscriber.countDocuments(PENDING_FILTER),
      Subscriber.aggregate<{ _id: string | null; count: number }>([
        { $match: { unsubscribed: true, confirmed: { $ne: false } } },
        { $group: { _id: '$unsubscribeReason', count: { $sum: 1 } } },
      ]),
    ]);

    const languageCounts: Record<string, number> = {};
    for (const row of byLanguage) if (row._id) languageCounts[row._id] = row.count;
    const unsubscribedByReason: Record<string, number> = {};
    let unsubscribed = 0;
    for (const row of unsubscribedRows) {
      unsubscribedByReason[row._id ?? 'user'] = (unsubscribedByReason[row._id ?? 'user'] ?? 0) + row.count;
      unsubscribed += row.count;
    }

    return NextResponse.json({
      total,
      recentCount,
      pending,
      unsubscribed,
      unsubscribedByReason,
      byLanguage: {
        ar: languageCounts.ar ?? 0,
        en: languageCounts.en ?? 0,
        fr: languageCounts.fr ?? 0,
        unknown: total - (languageCounts.ar ?? 0) - (languageCounts.en ?? 0) - (languageCounts.fr ?? 0),
      },
    });
  } catch (error) {
    return serverError('Failed to fetch subscriber stats', error);
  }
}
