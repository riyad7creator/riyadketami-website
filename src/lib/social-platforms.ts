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
