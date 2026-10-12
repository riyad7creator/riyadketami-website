import { BRAND } from '@/lib/brand';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/design-system'],
      },
    ],
    sitemap: `${BRAND.url}/sitemap.xml`,
  };
}
