import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Link from '@/models/Link';
import { serverError } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit(req, 10, 60_000);
  if (limited) return limited;

  try {
    const { id } = await params;
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
