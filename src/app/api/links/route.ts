import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Link from '@/models/Link';
import { linkSchema } from '@/lib/validation';
import { requireAdmin, zodFail, serverError } from '@/lib/api-helpers';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';

    if (isAdmin) {
      const check = await requireAdmin();
      if (!check.ok) return check.response;
    }

    const query = isAdmin ? {} : { isVisible: true };
    const links = await Link.find(query).sort({ order: 1 });
    return NextResponse.json(links);
  } catch (error) {
    return serverError('Failed to fetch links', error);
  }
}

export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await req.json() as unknown;
    const result = linkSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    const lastLink = await Link.findOne().sort({ order: -1 });
    const newOrder = lastLink ? lastLink.order + 1 : 0;
    const link = await Link.create({ ...result.data, order: newOrder });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    return serverError('Failed to create link', error);
  }
}
