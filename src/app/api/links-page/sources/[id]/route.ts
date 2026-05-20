import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db/connect';
import LatestSourceModel from '@/models/LatestSource';
import { requireAdmin, serverError, zodFail } from '@/lib/api-helpers';
import { latestSourcePatchSchema } from '@/lib/links-page-validation';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const { id } = await params;
    const body = (await req.json()) as unknown;
    const result = latestSourcePatchSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    await dbConnect();
    const source = await LatestSourceModel.findByIdAndUpdate(
      id,
      { $set: result.data },
      { new: true, runValidators: true }
    ).lean();

    if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    revalidateTag('links-page', {});
    revalidateTag('rss', {});
    return NextResponse.json(source);
  } catch (error) {
    return serverError('Failed to update source', error);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const { id } = await params;
    await dbConnect();
    const source = await LatestSourceModel.findByIdAndDelete(id).lean();
    if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    revalidateTag('links-page', {});
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Failed to delete source', error);
  }
}
