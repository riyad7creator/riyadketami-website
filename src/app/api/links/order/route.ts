import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Link from '@/models/Link';
import { requireAdmin, serverError } from '@/lib/api-helpers';

interface OrderItem {
  id: string;
  order: number;
}

export async function PUT(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const body = await req.json() as { items?: OrderItem[] };
    const items = body.items;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 });
    }

    await dbConnect();

    await Promise.all(
      items.map(({ id, order }) =>
        Link.findByIdAndUpdate(id, { order })
      )
    );

    return NextResponse.json({ message: 'Order updated' });
  } catch (error) {
    return serverError('Failed to update order', error);
  }
}
