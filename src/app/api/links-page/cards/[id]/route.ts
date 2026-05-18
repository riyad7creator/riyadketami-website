import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db/connect';
import LinkCardModel from '@/models/LinkCard';
import { requireAdmin, serverError, zodFail } from '@/lib/api-helpers';
import { linkCardPatchSchema } from '@/lib/links-page-validation';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const { id } = await params;
    const body = (await req.json()) as unknown;
    const result = linkCardPatchSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    await dbConnect();
    const card = await LinkCardModel.findByIdAndUpdate(
      id,
      { $set: result.data },
      { new: true, runValidators: true }
    ).lean();

    if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    revalidateTag('links-page', 'max');
    return NextResponse.json(card);
  } catch (error) {
    return serverError('Failed to update card', error);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const { id } = await params;
    await dbConnect();
    const card = await LinkCardModel.findByIdAndDelete(id).lean();
    if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    revalidateTag('links-page', 'max');
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Failed to delete card', error);
  }
}
