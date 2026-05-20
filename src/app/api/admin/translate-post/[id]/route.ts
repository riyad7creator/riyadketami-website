import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import DOMPurify from 'isomorphic-dompurify';

/** PATCH /api/admin/translate-post/[id]  — save manual edits to a translation */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    await dbConnect();

    const body = await req.json() as { title?: string; excerpt?: string; content?: string };
    const update: Record<string, unknown> = { manually_edited: true };
    if (body.title !== undefined) update.title = body.title;
    if (body.excerpt !== undefined) update.excerpt = body.excerpt;
    if (body.content !== undefined) update.content = DOMPurify.sanitize(body.content);

    const post = await Post.findByIdAndUpdate(id, update, { new: true, runValidators: false });
    if (!post) return NextResponse.json({ error: 'Translation not found' }, { status: 404 });

    return NextResponse.json(post);
  } catch (error) {
    return serverError('Failed to save translation edits', error);
  }
}
