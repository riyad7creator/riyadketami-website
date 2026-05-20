import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError } from '@/lib/api-helpers';

/** GET /api/admin/ai/translation-gaps — find EN posts missing FR or AR */
export async function GET() {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();

    const gaps = await Post.aggregate<{
      _id: string;
      title: string;
      slug: string;
      views: number;
      createdAt: Date;
      missingLangs: string[];
    }>([
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
          views: 1,
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
      { $sort: { views: -1, createdAt: -1 } },
      { $limit: 30 },
    ]);

    // Annotate which languages are missing
    const withMissing = gaps.map(post => ({
      ...post,
      missingLangs: ['fr', 'ar'].filter(
        l => !(post as unknown as { translatedLangs?: string[] }).translatedLangs?.includes(l)
      ),
    }));

    return NextResponse.json({ gaps: withMissing, total: withMissing.length });
  } catch (error) {
    return serverError('Failed to find translation gaps', error);
  }
}
