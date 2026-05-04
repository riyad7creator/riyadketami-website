import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Link from '@/models/Link';
import { requireAdmin, serverError } from '@/lib/api-helpers';

export async function PUT(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await req.json() as { links?: { _id: string; order: number }[] };

    if (!Array.isArray(body.links)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const operations = body.links.map((link) => ({
      updateOne: { filter: { _id: link._id }, update: { order: link.order } },
    }));

    await Link.bulkWrite(operations);
    return NextResponse.json({ message: 'Links reordered' });
  } catch (error) {
    return serverError('Failed to reorder links', error);
  }
}
