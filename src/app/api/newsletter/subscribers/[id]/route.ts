import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { later } from '@/lib/newsletter/lifecycle';
import { syncSubscriber, removeContact, espReady } from '@/lib/newsletter/esp';
import { unsubscribeFromKit } from '@/lib/kit';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const patchSchema = z.object({
  preferredLanguage: z.enum(['ar', 'en', 'fr']).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await params;
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });

  try {
    const parsed = patchSchema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid language value' }, { status: 400 });

    await dbConnect();
    const update =
      parsed.data.preferredLanguage === null
        ? { $unset: { preferredLanguage: 1 } }
        : parsed.data.preferredLanguage
          ? { $set: { preferredLanguage: parsed.data.preferredLanguage } }
          : {};
    const sub = await Subscriber.findByIdAndUpdate(id, update, { new: true });
    if (!sub) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    later(() => syncSubscriber(sub.email));
    return NextResponse.json({ subscriber: sub });
  } catch (err) {
    return serverError('Failed to update subscriber', err);
  }
}

/** DELETE: erase the person everywhere (GDPR / Law 18-07 erasure request) */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await params;
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });

  try {
    await dbConnect();
    const sub = await Subscriber.findByIdAndDelete(id);
    if (!sub) return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    if (espReady()) {
      try {
        await removeContact(sub.email);
      } catch (err) {
        console.error('[newsletter] Resend erase failed:', err);
        return NextResponse.json({ message: 'Deleted here, but removing the contact from Resend failed. Delete it in the Resend dashboard.' }, { status: 207 });
      }
    }
    // Kit has no delete endpoint: unsubscribing is the closest it allows
    later(() => unsubscribeFromKit(sub.email));
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return serverError('Failed to delete subscriber', error);
  }
}
