import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { requireAdmin, serverError } from '@/lib/api-helpers';

/** GET /api/admin/analytics — blog analytics aggregations */
export async function GET(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') ?? 'overview';

    if (mode === 'overview') {
      const [
        topAllTime,
        viewsThisWeek,
        viewsLastWeek,
        langSplit,
        zeroViewPosts,
        translationGaps,
      ] = await Promise.all([
        // Top 10 posts all time by views
        Post.find({ status: 'published' })
          .sort({ views: -1 })
          .limit(10)
          .select('title slug views language category createdAt')
          .lean(),

        // Views this week
        AnalyticsEvent.countDocuments({ type: 'view', createdAt: { $gte: sevenDaysAgo } }),

        // Views last week (for delta)
        AnalyticsEvent.countDocuments({
          type: 'view',
          createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
        }),

        // Language split this week
        AnalyticsEvent.aggregate<{ _id: string | null; count: number }>([
          { $match: { type: 'view', createdAt: { $gte: sevenDaysAgo } } },
          { $group: { _id: '$lang', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Posts with zero views
        Post.find({ status: 'published', views: 0 })
          .select('title slug language createdAt')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),

        // EN posts missing FR or AR
        Post.aggregate<{ _id: string; title: string; slug: string; createdAt: Date; translatedLangs: string[] }>([
          { $match: { status: 'published', language: 'en' } },
          {
            $lookup: {
              from: 'posts',
              localField: '_id',
              foreignField: 'translated_from',
              as: 'translations',
            },
          },
          {
            $project: {
              title: 1,
              slug: 1,
              createdAt: 1,
              translatedLangs: '$translations.language',
            },
          },
          {
            $match: {
              $or: [
                { translatedLangs: { $not: { $elemMatch: { $eq: 'fr' } } } },
                { translatedLangs: { $not: { $elemMatch: { $eq: 'ar' } } } },
              ],
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 20 },
        ]),
      ]);

      // Top 10 posts this week
      const topThisWeek = await AnalyticsEvent.aggregate<{ _id: string; views: number }>([
        { $match: { type: 'view', postId: { $exists: true }, createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$postId', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
      ]);

      // Enrich topThisWeek with post metadata
      const postIds = topThisWeek.map(t => t._id);
      const postsMap = await Post.find({ _id: { $in: postIds } })
        .select('title slug language')
        .lean()
        .then(posts => Object.fromEntries(posts.map(p => [(p._id as { toString(): string }).toString(), p])));

      const topThisWeekEnriched = topThisWeek.map(t => ({
        ...t,
        ...(postsMap[t._id] ?? {}),
      }));

      return NextResponse.json({
        topAllTime,
        topThisWeek: topThisWeekEnriched,
        viewsThisWeek,
        viewsLastWeek,
        langSplit,
        zeroViewPosts,
        translationGaps,
      });
    }

    return NextResponse.json({ error: 'Unknown mode' }, { status: 400 });
  } catch (error) {
    return serverError('Failed to fetch analytics', error);
  }
}
