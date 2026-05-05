import dbConnect from '@/lib/db/connect';
import SocialAccount from '@/models/SocialAccount';
import type { ISocialAccount, SocialPlatform } from '@/models/SocialAccount';
import Post from '@/models/Post';
import type { IPost } from '@/models/Post';
import type { Locale } from '@/i18n/config';

export interface SocialEntry {
  platform: SocialPlatform;
  handle: string;
  url: string;
  followers: number;
}

export type TeaserPost = Pick<
  IPost,
  'slug' | 'title' | 'excerpt' | 'category' | 'featuredImage' | 'createdAt' | 'readTime' | 'language'
>;

async function getSocials(): Promise<SocialEntry[]> {
  try {
    await dbConnect();
    const docs = await SocialAccount.find({ visible: true })
      .sort({ order: 1, follower_count: -1 })
      .lean<Array<Pick<ISocialAccount, 'platform' | 'handle' | 'url' | 'follower_count'>>>();
    return docs.map((d) => ({
      platform: d.platform,
      handle: d.handle,
      url: d.url,
      followers: d.follower_count,
    }));
  } catch {
    return [];
  }
}

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
  const [socials, posts] = await Promise.all([getSocials(), getRecentPosts(lang)]);
  return { socials, posts };
}
