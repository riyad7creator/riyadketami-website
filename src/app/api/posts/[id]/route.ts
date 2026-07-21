import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { postSchema } from '@/lib/validation';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin, zodFail, serverError } from '@/lib/api-helpers';

/** Revalidate every public path a post can appear on — status/slug/language may have just changed. */
function revalidatePost(language: string, slug: string) {
  revalidatePath(`/${language}`);
  revalidatePath(`/${language}/blog`);
  revalidatePath(`/${language}/blog/${slug}`);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();

    const check = await requireAdmin();
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query: Record<string, unknown> = isObjectId ? { _id: id } : { slug: id };
    if (!check.ok) query['status'] = 'published';

    const post = await Post.findOne(query).populate('author', 'name image bio');

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!isObjectId && post.status === 'published') {
      Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } }).exec();
    }

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
    const body = await req.json() as unknown;
    const result = postSchema.partial().safeParse(body);
    if (!result.success) return zodFail(result.error);

    const data = result.data;
    if (data.content) data.content = DOMPurify.sanitize(data.content);

    const post = await Post.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    revalidatePost(post.language, post.slug);

    return NextResponse.json(post);
  } catch (error) {
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

    revalidatePost(post.language, post.slug);

    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    return serverError('Failed to delete post', error);
  }
}
