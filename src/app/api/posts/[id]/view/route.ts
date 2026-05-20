import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { rateLimit } from '@/lib/rate-limit';
import { serverError } from '@/lib/api-helpers';

/**
 * POST /api/posts/[id]/view
 *
 * Accepts either a MongoDB ObjectId OR a slug. Increments Post.views and
 * logs an AnalyticsEvent for per-post analytics.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Silently pass rate-limited requests — don't reveal the limit to clients
  const limited = await rateLimit(req, 5, 60_000, 'view');
  if (limited) return NextResponse.json({ ok: true });

  try {
    const { id } = await params;
    await dbConnect();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const post = await Post.findOneAndUpdate(
      isObjectId
        ? { _id: id, status: 'published' as const }
        : { slug: id, status: 'published' as const },
      { $inc: { views: 1 } },
      { new: false }
    ).lean() as { _id: { toString(): string }; language?: string } | null;

    if (post) {
      const referrer = req.headers.get('referer') ?? undefined;
      const url = new URL(req.url);
      const path = url.searchParams.get('path') ?? `/${id}`;

      AnalyticsEvent.create({
        type: 'view',
        postId: post._id.toString(),
        referrer: referrer ? referrer.slice(0, 500) : undefined,
        path: path.slice(0, 500),
        lang: (post as { language?: string }).language,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Failed to record view', error);
  }
}
