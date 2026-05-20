import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  type: z.enum(['view', 'click']),
  postId: z.string().optional(),
  path: z.string().max(500),
  lang: z.string().max(5).optional(),
});

/** POST /api/analytics/event — public, rate-limited event ingestion */
export async function POST(req: Request) {
  const limited = rateLimit(req, 10, 60_000);
  if (limited) return limited;

  try {
    const body = await req.json() as unknown;
    const result = schema.safeParse(body);
    if (!result.success) return NextResponse.json({ ok: false }, { status: 400 });

    const referrer = req.headers.get('referer') ?? undefined;

    await dbConnect();
    await AnalyticsEvent.create({
      ...result.data,
      referrer: referrer ? referrer.slice(0, 500) : undefined,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
