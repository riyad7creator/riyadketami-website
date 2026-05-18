import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { serverError } from '@/lib/api-helpers';
import { z } from 'zod';

const patchSchema = z.object({
  preferredLanguage: z.enum(['ar', 'en', 'fr']).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.parse(body);

    await dbConnect();
    const update: Record<string, unknown> = {};
    if (parsed.preferredLanguage === null) {
      update.$unset = { preferredLanguage: 1 };
    } else if (parsed.preferredLanguage) {
      update.$set = { preferredLanguage: parsed.preferredLanguage };
    }

    const sub = await Subscriber.findByIdAndUpdate(
      id,
      Object.keys(update).length > 0 ? update : {},
      { new: true }
    );

    if (!sub) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    return NextResponse.json({ subscriber: sub });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid language value' }, { status: 400 });
    }
    return serverError('Failed to update subscriber', err);
  }
}

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
