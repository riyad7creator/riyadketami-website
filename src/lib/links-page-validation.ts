import { z } from 'zod';

/** Only allow safe URL schemes — no javascript: or data: URIs */
const safeHref = z
  .string()
  .min(1, 'URL is required')
  .refine(
    (v) => v.startsWith('https://') || v.startsWith('http://') || v.startsWith('/'),
    { message: 'URL must start with https://, http://, or /' }
  );

const optionalUrl = z.string().url().optional().or(z.literal(''));

// ---------------------------------------------------------------------------
// LinkCard
// ---------------------------------------------------------------------------

export const linkCardSchema = z
  .object({
    section: z.enum(['sponsored', 'resource', 'service', 'fallback']),
    title: z.string().min(1, 'Title is required').max(80),
    description: z.string().max(200).optional(),
    href: safeHref,
    icon: z.string().max(50).optional(),
    thumbnail: optionalUrl,
    pillLabel: z.string().max(20).optional(),
    pillVariant: z.enum(['sponsored', 'new', 'free', 'booking', 'affiliate', 'custom']).optional(),
    pillColor: z.string().max(20).optional(),
    order: z.number().int().min(0).optional(),
    active: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
  })
  .refine(
    (d) => {
      if (d.startsAt && d.endsAt) return new Date(d.startsAt) < new Date(d.endsAt);
      return true;
    },
    { message: 'Start date must be before end date', path: ['endsAt'] }
  );

export const linkCardPatchSchema = linkCardSchema.partial().omit({ section: true });

// ---------------------------------------------------------------------------
// LatestSource
// ---------------------------------------------------------------------------

export const latestSourceSchema = z
  .object({
    type: z.enum(['youtube', 'blog', 'tiktok', 'instagram']),
    label: z.string().min(1).max(50),
    rssUrl: optionalUrl,
    manualUrl: optionalUrl,
    manualTitle: z.string().max(200).optional(),
    manualThumb: optionalUrl,
    active: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  })
  .refine(
    (d) => (d.rssUrl && d.rssUrl.length > 0) || (d.manualUrl && d.manualTitle),
    { message: 'Either rssUrl or both manualUrl and manualTitle are required' }
  );

export const latestSourcePatchSchema = latestSourceSchema.partial();

// ---------------------------------------------------------------------------
// SiteProfile
// ---------------------------------------------------------------------------

const socialEntrySchema = z.object({
  url: safeHref,
  count: z.string().max(20),
  channelId: z.string().max(50).optional(),
});

export const siteProfileSchema = z
  .object({
    name: z.string().min(1).max(100),
    tagline: z.string().min(1).max(200),
    statusLine: z.string().max(200).optional(),
    statusEnabled: z.boolean(),
    subscriberCount: z.number().int().min(0),
    socials: z
      .object({
        tiktok: socialEntrySchema.optional(),
        youtube: socialEntrySchema.optional(),
        instagram: socialEntrySchema.optional(),
      })
      .optional(),
  })
  .partial();
