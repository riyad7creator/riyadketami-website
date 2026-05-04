import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import { postSchema } from '@/lib/validation';
import DOMPurify from 'isomorphic-dompurify';

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
      const session = await auth();
      if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (!isAdmin) query.status = 'published';
    if (language) query.language = language;
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
    if (tag) query.tags = tag;
    if (category) query.category = category;

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('author', 'name image'),
      Post.countDocuments(query),
    ]);

    return NextResponse.json({ posts, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json() as unknown;
    const result = postSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message }, { status: 400 });
    }

    const data = result.data;
    if (data.content) data.content = DOMPurify.sanitize(data.content);

    if (!data.slug && data.title) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const post = await Post.create({ ...data, author: session.user.id });
    return NextResponse.json(post, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating post:', error);
    const message = (error as { code?: number })?.code === 11000
      ? 'A post with this slug already exists'
      : 'Failed to create post';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
