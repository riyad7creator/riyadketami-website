import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { rateLimit } from '@/lib/rate-limit';
import { serverError } from '@/lib/api-helpers';

/**
 * POST /api/posts/[id]/view
 *
 * The `id` segment accepts either a MongoDB ObjectId OR a slug — the route
 * tries slug first (most common path from ViewTracker), then ObjectId.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Silently pass rate-limited requests — don't reveal the limit to clients
  const limited = rateLimit(req, 5, 60_000);
  if (limited) return NextResponse.json({ ok: true });

  try {
    const { id } = await params;
    await dbConnect();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    await Post.findOneAndUpdate(
      isObjectId
        ? { _id: id, status: 'published' as const }
        : { slug: id, status: 'published' as const },
      { $inc: { views: 1 } }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Failed to record view', error);
  }
}
