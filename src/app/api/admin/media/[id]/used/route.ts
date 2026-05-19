import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import MediaFileModel from '@/models/MediaFile';
import { requireAdmin, serverError } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const MAX_USED_IN = 200;

/** POST /api/admin/media/[id]/used — add a referenceId to usedIn array */
export async function POST(req: Request, { params }: Params) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    if (!OBJECT_ID.test(id)) {
      return NextResponse.json({ error: 'Invalid media id' }, { status: 400 });
    }

    const { referenceId } = (await req.json()) as { referenceId?: string };
    if (!referenceId || !OBJECT_ID.test(referenceId)) {
      return NextResponse.json({ error: 'Valid referenceId required' }, { status: 400 });
    }

    await dbConnect();

    // Only push if under the cap — protects against runaway accumulation.
    const result = await MediaFileModel.updateOne(
      { _id: id, $expr: { $lt: [{ $size: { $ifNull: ['$usedIn', []] } }, MAX_USED_IN] } },
      { $addToSet: { usedIn: referenceId } }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Reference cap reached or media not found' },
        { status: 409 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Failed to update media usage', error);
  }
}
