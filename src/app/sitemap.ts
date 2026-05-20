import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { getBlogPosts } from '@/lib/blog-data';

const BASE = 'https://riyadketami.com';

const STATIC_PATHS = ['', '/about', '/services', '/blog', '/contact'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Locale-independent pages
  entries.push({
    url: `${BASE}/links`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  });

  // Static pages for all locales
  for (const locale of locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${BASE}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === '/blog' ? 'daily' : 'weekly',
        priority: path === '' ? 1.0 : path === '/services' ? 0.9 : 0.8,
      });
    }
  }

  // Blog posts per locale — fetch all locales in parallel
  const postsByLocale = await Promise.all(locales.map((locale) => getBlogPosts(locale)));
  for (let i = 0; i < locales.length; i++) {
    const locale = locales[i]!;
    const posts = postsByLocale[i]!;
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
