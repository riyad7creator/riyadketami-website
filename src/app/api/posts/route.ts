import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { postSchema } from '@/lib/validation';
import DOMPurify from 'isomorphic-dompurify';
import { requireAdmin, zodFail, serverError, generateSlug, escapeRegex } from '@/lib/api-helpers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '12');
    const search = searchParams.get('search') ?? '';
    const tag = searchParams.get('tag') ?? '';
    const category = searchParams.get('category') ?? '';
    const language = searchParams.get('language') ?? '';

    if (isAdmin) {
      const check = await requireAdmin();
      if (!check.ok) return check.response;
    }

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (!isAdmin) query['status'] = 'published';
    if (language) query['language'] = language;
    if (search) {
      const safeSearch = escapeRegex(search);
      query['$or'] = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { content: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    if (tag) query['tags'] = tag;
    if (category) query['category'] = category;

    const skip = (page - 1) * limit;

    // For public requests, strip heavy fields (content, author full doc) to reduce payload
    const publicSelect = '_id title slug excerpt featuredImage category tags status language views readTime createdAt updatedAt';

    const [posts, total] = await Promise.all([
      isAdmin
        ? Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name image').lean()
        : Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select(publicSelect).lean(),
      Post.countDocuments(query),
    ]);

    return NextResponse.json({ posts, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return serverError('Failed to fetch posts', error);
  }
}

export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await req.json() as unknown;
    const result = postSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    const data = result.data;
    if (data.content) data.content = DOMPurify.sanitize(data.content);
    if (!data.slug && data.title) data.slug = generateSlug(data.title);

    const post = await Post.create({ ...data, author: check.session.user.id });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ error: 'A post with this slug already exists' }, { status: 409 });
    }
    return serverError('Failed to create post', error);
  }
}
