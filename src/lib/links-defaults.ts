import { BRAND } from '@/lib/brand';

/**
 * Default /links profile, returned by /api/links-page/profile when no document
 * exists. Identity comes from BRAND; counts stay empty — the public site never
 * shows follower or subscriber numbers (brief §2.1).
 */
export const DEFAULT_LINKS_PROFILE = {
  _id: 'links-profile' as const,
  name: BRAND.name,
  tagline: `${BRAND.title} · ${BRAND.proofLine}`,
  statusLine: '' as string | undefined,
  statusEnabled: false,
  subscriberCount: 0,
  socials: {
    tiktok: { url: BRAND.socials.find((s) => s.key === 'tiktok')!.url, count: '' },
    youtube: { url: BRAND.youtubeUrl, count: '', channelId: '' },
    instagram: { url: BRAND.socials.find((s) => s.key === 'instagram')!.url, count: '' },
  },
};
