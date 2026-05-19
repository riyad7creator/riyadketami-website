import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Link from '@/models/Link';
import { serverError } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/links/[id]/click — fire-and-forget click counter.
 *
 * Kept for backwards compatibility with existing client-side trackers.
 * Higher rate limit than the legacy 10/min since legitimate viral traffic from
 * a single mobile-carrier NAT can far exceed that. View inflation is bounded
 * to once per IP per second-bucket.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await rateLimit(req, 60, 60_000, 'click');
  if (limited) return NextResponse.json({ ok: true }); // silent drop

  try {
    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    await dbConnect();
    const link = await Link.findByIdAndUpdate(
      id,
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    return NextResponse.json({ clicks: link.clicks });
  } catch (error) {
    return serverError('Failed to record click', error);
  }
}
