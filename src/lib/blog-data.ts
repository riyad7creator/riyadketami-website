import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import type { IPost } from '@/models/Post';
import type { BlogCategory } from '@/lib/blog-categories';
import type { Locale } from '@/i18n/config';

export type PostListItem = Pick<
  IPost,
  'slug' | 'title' | 'excerpt' | 'category' | 'featuredImage' | 'createdAt' | 'readTime' | 'language'
>;

export type PostFull = Pick<
  IPost,
  'slug' | 'title' | 'excerpt' | 'content' | 'category' | 'featuredImage' | 'createdAt' | 'updatedAt' | 'readTime' | 'language' | 'tags'
>;

export async function getBlogPosts(lang: Locale, category?: BlogCategory): Promise<PostListItem[]> {
  try {
    await dbConnect();
    const filter: Record<string, unknown> = { status: 'published', language: lang };
    if (category) filter.category = category;
    return await Post.find(filter)
      .sort({ createdAt: -1 })
      .select('slug title excerpt category featuredImage createdAt readTime language')
      .lean<PostListItem[]>();
  } catch {
    return [];
  }
}

export async function getBlogPost(lang: Locale, slug: string): Promise<PostFull | null> {
  try {
    await dbConnect();
    return await Post.findOne({ slug, language: lang, status: 'published' })
      .select('slug title excerpt content category featuredImage createdAt updatedAt readTime language tags')
      .lean<PostFull>();
  } catch {
    return null;
  }
}
