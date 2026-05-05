export const BLOG_CATEGORIES = [
  { value: 'business', label: 'Business' },
  { value: 'digital-marketing', label: 'Digital Marketing' },
  { value: 'ai', label: 'AI' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'creativity', label: 'Creativity' },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]['value'];
