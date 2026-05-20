import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { serverError } from '@/lib/api-helpers';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await dbConnect();
    const sub = await Subscriber.findByIdAndDelete(id);
    if (!sub) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return serverError('Failed to delete subscriber', error);
  }
}
