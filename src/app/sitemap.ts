import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { getBlogPosts } from '@/lib/blog-data';

const BASE = 'https://riyadketami.com';

const STATIC_PATHS = ['', '/about', '/consulting', '/blog', '/contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages for all locales
  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '/blog' ? 'daily' : 'weekly',
        priority: path === '' ? 1.0 : path === '/consulting' ? 0.9 : 0.8,
      });
    }
  }

  // Blog posts per locale
  for (const locale of locales) {
    const posts = await getBlogPosts(locale);
    for (const post of posts) {
      entries.push({
        url: `${BASE}/${locale}/blog/${post.slug}`,
        lastModified: new Date(post.createdAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return entries;
}
