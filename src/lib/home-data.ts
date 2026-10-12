import dbConnect from '@/lib/db/connect';
import Post from '@/models/Post';
import type { IPost } from '@/models/Post';
import type { Locale } from '@/i18n/config';

export type TeaserPost = Pick<
  IPost,
  'slug' | 'title' | 'excerpt' | 'category' | 'featuredImage' | 'createdAt' | 'readTime' | 'language'
>;

// Socials and links come from BRAND (src/lib/brand.ts), not the DB: the public
// site never reads follower counts (brief §2.1).

async function getRecentPosts(lang: Locale): Promise<TeaserPost[]> {
  try {
    await dbConnect();
    return await Post.find({ status: 'published', language: lang })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('slug title excerpt category featuredImage createdAt readTime language')
      .lean<TeaserPost[]>();
  } catch {
    return [];
  }
}

export async function getHomeData(lang: Locale) {
  const posts = await getRecentPosts(lang);
  return { posts };
}
