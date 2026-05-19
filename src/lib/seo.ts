import { locales, type Locale } from '@/i18n/config';

/**
 * Build canonical + hreflang `alternates` for a page, anchored on a known path
 * suffix (no leading slash for the suffix). Reading `next-url` from headers is
 * brittle across Next versions — each page passes its own path here.
 *
 * @example
 *   localizedAlternates('en', 'services') →
 *     { canonical: '/en/services',
 *       languages: { en: '/en/services', fr: '/fr/services', ar: '/ar/services',
 *                    'x-default': '/en/services' } }
 */
export function localizedAlternates(lang: Locale | string, suffix = '') {
  const trail = suffix ? `/${suffix.replace(/^\/+/, '')}` : '';
  const languages = Object.fromEntries(
    locales.map((l) => [l, `/${l}${trail}`])
  ) as Record<string, string>;
  languages['x-default'] = `/en${trail}`;
  return {
    canonical: `/${lang}${trail}`,
    languages,
  };
}
