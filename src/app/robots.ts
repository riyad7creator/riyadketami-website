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
    sitemap: 'https://riyadketami.com/sitemap.xml',
  };
}
