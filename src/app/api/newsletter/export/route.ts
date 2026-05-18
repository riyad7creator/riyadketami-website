import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, serverError } from '@/lib/api-helpers';

export async function GET(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang')?.trim() ?? '';

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (lang && ['ar', 'en', 'fr'].includes(lang)) {
      query.preferredLanguage = lang;
    }

    const subscribers = await Subscriber.find(query)
      .sort({ createdAt: -1 })
      .select('email preferredLanguage createdAt')
      .lean();

    const csv =
      'email,preferredLanguage,subscriptionDate\n' +
      subscribers
        .map(
          (s) =>
            `${s.email},${s.preferredLanguage ?? ''},${new Date(s.createdAt).toISOString().slice(0, 10)}`
        )
        .join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="subscribers-${lang || 'all'}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return serverError('Failed to export subscribers', error);
  }
}
