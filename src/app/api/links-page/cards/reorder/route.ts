import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import LinkCardModel from '@/models/LinkCard';
import { requireAdmin, serverError, zodFail } from '@/lib/api-helpers';

const schema = z.object({
  ids: z.array(z.string()).min(1),
});

/** PATCH /api/links-page/cards/reorder — accepts ordered array of IDs, updates order field */
export async function PATCH(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const body = (await req.json()) as unknown;
    const result = schema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    await dbConnect();
    await Promise.all(
      result.data.ids.map((id, idx) =>
        LinkCardModel.findByIdAndUpdate(id, { $set: { order: idx } })
      )
    );

    revalidateTag('links-page', {});
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Failed to reorder cards', error);
  }
}
