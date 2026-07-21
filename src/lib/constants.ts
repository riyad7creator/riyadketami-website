// Pure constants — no mongoose dependency, safe to import in client components

/** Canonical production origin — single source of truth for metadata, sitemap, emails. */
export const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://ketami.net';

export const BLOG_CATEGORIES = [
  { value: 'business', label: 'Business' },
  { value: 'digital-marketing', label: 'Digital Marketing' },
  { value: 'ai', label: 'AI' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'creativity', label: 'Creativity' },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]['value'];
export const BLOG_CATEGORY_VALUES = BLOG_CATEGORIES.map((c) => c.value) as [BlogCategory, ...BlogCategory[]];

export const POST_LANGUAGES = ['en', 'fr', 'ar'] as const;
export type PostLanguage = (typeof POST_LANGUAGES)[number];

export const POST_STATUSES = ['draft', 'published'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const SOCIAL_PLATFORMS = [
  'tiktok',
  'instagram',
  'facebook',
  'youtube',
  'x',
  'linkedin',
  'github',
  'other',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const USER_ROLES = ['admin', 'editor', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];
