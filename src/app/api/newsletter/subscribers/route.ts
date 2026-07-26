import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, escapeRegex, serverError } from '@/lib/api-helpers';

export async function GET(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const { searchParams } = new URL(req.url);

    // Full-list CSV export — server-side so it is never limited to one UI page,
    // and includes unsubscribe status so a re-import elsewhere can respect it.
    if (searchParams.get('format') === 'csv') {
      await dbConnect();
      const all = await Subscriber.find({}).sort({ createdAt: -1 }).lean();
      const rows = all.map((s) =>
        [
          s.email,
          new Date(s.createdAt).toISOString().slice(0, 10),
          s.unsubscribed ? 'unsubscribed' : 'active',
        ].join(',')
      );
      const csv = 'email,joined,status\n' + rows.join('\n');
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));
    const search = searchParams.get('search')?.trim() ?? '';
    const skip = (page - 1) * limit;

    await dbConnect();

    const query = search
      ? { email: { $regex: escapeRegex(search), $options: 'i' } }
      : {};

    const [subscribers, total] = await Promise.all([
      Subscriber.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Subscriber.countDocuments(query),
    ]);

    return NextResponse.json({ subscribers, total });
  } catch (error) {
    return serverError('Failed to fetch subscribers', error);
  }
}
