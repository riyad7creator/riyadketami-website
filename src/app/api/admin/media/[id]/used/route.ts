import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import MediaFileModel from '@/models/MediaFile';
import { requireAdmin, serverError } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/media/[id]/used — add a referenceId to usedIn array */
export async function POST(req: Request, { params }: Params) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    const { referenceId } = (await req.json()) as { referenceId?: string };
    if (!referenceId) return NextResponse.json({ error: 'referenceId required' }, { status: 400 });

    await dbConnect();

    await MediaFileModel.findByIdAndUpdate(id, { $addToSet: { usedIn: referenceId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Failed to update media usage', error);
  }
}
