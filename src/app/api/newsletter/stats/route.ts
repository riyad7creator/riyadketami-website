import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, serverError } from '@/lib/api-helpers';

export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    await dbConnect();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    // Stats describe the live audience: unsubscribed rows are reported
    // separately and never counted as subscribers (matches GET /api/newsletter).
    const active = { unsubscribed: { $ne: true } };
    const [total, byLanguage, recentCount, unsubscribed] = await Promise.all([
      Subscriber.countDocuments(active),
      Subscriber.aggregate([
        { $match: active },
        {
          $group: {
            _id: '$preferredLanguage',
            count: { $sum: 1 },
          },
        },
      ]),
      Subscriber.countDocuments({ ...active, createdAt: { $gte: sevenDaysAgo } }),
      Subscriber.countDocuments({ unsubscribed: true }),
    ]);

    const languageCounts: Record<string, number> = {};
    for (const row of byLanguage) {
      if (row._id) {
        languageCounts[row._id as string] = row.count as number;
      }
    }

    return NextResponse.json({
      total,
      recentCount,
      unsubscribed,
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
