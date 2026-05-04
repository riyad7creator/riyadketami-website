import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/connect';
import Link from '@/models/Link';

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    console.error('Error reordering links:', error);
    return NextResponse.json({ error: 'Failed to reorder links' }, { status: 500 });
  }
}
