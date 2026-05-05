import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Link from '@/models/Link';
import { linkSchema } from '@/lib/validation';
import { requireAdmin, zodFail, serverError } from '@/lib/api-helpers';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    await dbConnect();
    const body = await req.json() as unknown;
    const result = linkSchema.partial().safeParse(body);
    if (!result.success) return zodFail(result.error);

    const link = await Link.findByIdAndUpdate(id, result.data, { new: true, runValidators: true });
    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

    return NextResponse.json(link);
  } catch (error) {
    return serverError('Failed to update link', error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    await dbConnect();
    const link = await Link.findByIdAndDelete(id);

    if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    return NextResponse.json({ message: 'Link deleted' });
  } catch (error) {
    return serverError('Failed to delete link', error);
  }
}
