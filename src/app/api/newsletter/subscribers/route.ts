import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, escapeRegex, serverError } from '@/lib/api-helpers';

export async function GET(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));
    const search = searchParams.get('search')?.trim() ?? '';
    const lang = searchParams.get('lang')?.trim() ?? '';
    const skip = (page - 1) * limit;

    await dbConnect();

    const query: Record<string, unknown> = {};

    if (search) {
      query.email = { $regex: escapeRegex(search), $options: 'i' };
    }

    if (lang && ['ar', 'en', 'fr'].includes(lang)) {
      query.preferredLanguage = lang;
    }

    const [subscribers, total] = await Promise.all([
      Subscriber.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Subscriber.countDocuments(query),
    ]);

    return NextResponse.json({ subscribers, total });
  } catch (error) {
    return serverError('Failed to fetch subscribers', error);
  }
}
