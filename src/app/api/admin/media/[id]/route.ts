import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import MediaFileModel from '@/models/MediaFile';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import type { MediaFolder } from '@/types/media';

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/admin/media/[id] — update alt text or folder */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    const body = (await req.json()) as { altText?: string; folder?: MediaFolder };

    // Only allow safe fields to be patched
    const patch: { altText?: string; folder?: MediaFolder } = {};
    if (typeof body.altText === 'string') patch.altText = body.altText;
    if (body.folder) patch.folder = body.folder;

    await dbConnect();

    const updated = await MediaFileModel.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return serverError('Failed to update media file', error);
  }
}

/** DELETE /api/admin/media/[id] — remove media record */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    await dbConnect();

    const file = await MediaFileModel.findById(id).lean();
    if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Refuse deletion if the file is referenced by posts / settings
    if (file.usedIn && file.usedIn.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete: used in ${file.usedIn.length} post(s). Remove it from those posts first.` },
        { status: 409 }
      );
    }

    await MediaFileModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Failed to delete media file', error);
  }
}
