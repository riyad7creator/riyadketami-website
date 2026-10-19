import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import MediaFileModel from '@/models/MediaFile';
import { postSchema } from '@/lib/validation';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin, zodFail, serverError, readJson } from '@/lib/api-helpers';
import { revalidateBlog } from '@/lib/revalidate';

/** Fields the editor may clear by sending '' (answered with $unset) */
const CLEARABLE = ['excerpt', 'category', 'featuredImage'] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };
    const post = await Post.findOne(query).populate('author', 'name image bio');

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Drafts are only visible to admins; everyone else gets the same 404 as a missing post
    if (post.status !== 'published') {
      const check = await requireAdmin();
      if (!check.ok) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // View counting is handled by the client `ViewTracker` hitting
    // /api/posts/[slug]/view exactly once per page load. Counting again here
    // would double-count any admin loading the editor or any client that
    // hydrates the page after this fetch.

    return NextResponse.json(post);
  } catch (error) {
    return serverError('Failed to fetch post', error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { id } = await params;
    await dbConnect();
    const body = await readJson(req);
    const result = postSchema.partial().safeParse(body);
    if (!result.success) return zodFail(result.error);

    const data: Record<string, unknown> = { ...result.data };
    if (typeof data.content === 'string') data.content = DOMPurify.sanitize(data.content);

    const unset: Record<string, 1> = {};
    for (const field of CLEARABLE) {
      if (data[field] === '') {
        delete data[field];
        unset[field] = 1;
      }
    }

    const update: Record<string, unknown> = { $set: data };
    if (Object.keys(unset).length > 0) update.$unset = unset;

    const post = await Post.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // A status change on a source post applies to its FR/AR translations too
    if (result.data.status && !post.translated_from) {
      await Post.updateMany({ translated_from: post._id }, { $set: { status: result.data.status } });
    }

    revalidateBlog();
    return NextResponse.json(post);
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: 'A post with this slug already exists in this language' }, { status: 409 });
    }
    return serverError('Failed to update post', error);
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
    const post = await Post.findByIdAndDelete(id);

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Deleting a source post removes its translations as well
    const translations = await Post.find({ translated_from: post._id }).select('_id').lean();
    const translationIds = translations.map((t) => String(t._id));
    if (translationIds.length > 0) await Post.deleteMany({ _id: { $in: translationIds } });

    // Pull these ids from every media file's `usedIn` so deletion isn't
    // blocked later by stale references.
    const ids = [id, ...translationIds];
    await MediaFileModel.updateMany({ usedIn: { $in: ids } }, { $pull: { usedIn: { $in: ids } } });

    revalidateBlog();
    return NextResponse.json({ message: 'Post deleted', translationsDeleted: translationIds.length });
  } catch (error) {
    return serverError('Failed to delete post', error);
  }
}
