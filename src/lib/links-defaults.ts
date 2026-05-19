/**
 * Single source of truth for the /links page profile defaults.
 *
 * Used by:
 *   - /api/links-page/profile/route.ts  (returned when no doc exists)
 *   - /app/links/page.tsx               (fallback if MongoDB is unreachable)
 */
export const DEFAULT_LINKS_PROFILE = {
  _id: 'links-profile' as const,
  name: 'Riyad Ketami',
  tagline: 'Digital Entrepreneur · AI Consultant · Creator',
  statusLine: '' as string | undefined,
  statusEnabled: false,
  subscriberCount: 5000,
  socials: {
    tiktok: { url: 'https://tiktok.com/@riyadketami', count: '200K+' },
    youtube: { url: 'https://youtube.com/@riyadketami', count: '50K+', channelId: '' },
    instagram: { url: 'https://instagram.com/riyadketami', count: '80K+' },
  },
};
