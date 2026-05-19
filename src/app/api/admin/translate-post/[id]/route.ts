import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError, zodFail } from '@/lib/api-helpers';
import DOMPurify from 'isomorphic-dompurify';

const patchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  excerpt: z.string().max(300).optional(),
  content: z.string().min(1).optional(),
});

/** PATCH /api/admin/translate-post/[id]  — save manual edits to a translation */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    await dbConnect();

    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) return zodFail(parsed.error);
    const body = parsed.data;

    const update: Record<string, unknown> = { manually_edited: true };
    if (body.title !== undefined) update.title = body.title;
    if (body.excerpt !== undefined) update.excerpt = body.excerpt;
    if (body.content !== undefined) update.content = DOMPurify.sanitize(body.content);

    const post = await Post.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!post) return NextResponse.json({ error: 'Translation not found' }, { status: 404 });

    return NextResponse.json(post);
  } catch (error) {
    return serverError('Failed to save translation edits', error);
  }
}
