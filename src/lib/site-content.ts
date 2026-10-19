import { cache } from 'react';
import { BRAND } from '@/lib/brand';
import { getDictionary, type Dictionary } from '@/lib/dictionaries';
import { applyTextOverrides, type SiteTextStore } from '@/lib/site-text';
import type { Locale } from '@/i18n/config';

/**
 * Single registry for every editable image and link on the public site.
 * Components read through getSiteImages() / getSiteLinks(), never BRAND.visuals
 * directly, so the admin (rk-studio → Content) can override any slot without code.
 * Defaults below are the shipped files; overrides are layered on in getSiteImages().
 */

export interface ImageSlot {
  label: string;
  section: string;
  /** Where it appears, shown in the admin */
  hint: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}

const V = BRAND.visuals;

export const IMAGE_SLOTS = {
  heroDesktop: { label: 'Hero (desktop)', section: 'Home · Hero', hint: '16:9, subject on the right, dark left side for the headline', ...V.V08 },
  heroMobile: { label: 'Hero (mobile)', section: 'Home · Hero', hint: '3:4 portrait, shown under the headline on phones', ...V.V01 },
  cardDarija: { label: 'Card 1: AI in Darija', section: 'Home · What I do', hint: '4:3', ...V.V02 },
  cardLaunch: { label: 'Card 2: Launch partner in MENA', section: 'Home · What I do', hint: '4:3', ...V.V03 },
  cardTalks: { label: 'Card 3: Talks and workshops', section: 'Home · What I do', hint: '4:3', ...V.V04 },
  abbCover: { label: 'ABB cover background', section: 'Home · Algeria Business Bay + Bio page', hint: '2:1 wide, darkened behind the logo and text', src: '/abb/abb-cover.jpg', width: 2400, height: 1200, alt: '' },
  abbLogo: { label: 'ABB logo (white)', section: 'Home · Algeria Business Bay + Bio page', hint: 'Light logo on transparent background (SVG or PNG)', src: '/abb/abb-logo-white.svg', width: 1876, height: 351, alt: 'Algeria Business Bay' },
  contactBg: { label: 'Contact background', section: 'Home · Contact', hint: '16:9, subject on the right, darkened behind the text', ...V.V09 },
  aboutMain: { label: 'About main image', section: 'About', hint: '3:2', ...V.V11 },
  readyToStart: { label: '"Ready to start?" image', section: 'Services · Call to action', hint: '16:9', ...V.V10 },
  avatar: { label: 'Profile picture', section: 'Bio page + About', hint: 'Square', src: BRAND.images.avatar, width: 800, height: 800, alt: 'Riyad Ketami, portrait' },
} satisfies Record<string, ImageSlot>;

export type ImageSlotKey = keyof typeof IMAGE_SLOTS;
export type SiteImage = Pick<ImageSlot, 'src' | 'width' | 'height' | 'alt'>;
export type SiteImages = Record<ImageSlotKey, SiteImage>;

/** SiteSettings keys written by rk-studio, Content */
export const SITE_CONTENT_KEYS = {
  images: 'site-images',
  text: 'site-text',
  links: 'site-links',
} as const;

export type ImageOverrides = Partial<Record<ImageSlotKey, Partial<SiteImage>>>;

interface SiteContentOverrides {
  images: ImageOverrides | null;
  text: SiteTextStore | null;
  links: SiteLink[] | null;
}

const EMPTY_OVERRIDES: SiteContentOverrides = { images: null, text: null, links: null };

// After a failed read (DB down, env missing) skip MongoDB for a minute so a
// build or a burst of requests does not wait on the connect timeout every time.
let lastFailureAt = 0;
const RETRY_AFTER_MS = 60_000;

/**
 * One query for all three admin keys, deduped per request by React cache.
 * Non-fatal: any failure falls back to the shipped defaults.
 */
const loadOverrides = cache(async (): Promise<SiteContentOverrides> => {
  if (!process.env.MONGODB_URI) return EMPTY_OVERRIDES;
  if (Date.now() - lastFailureAt < RETRY_AFTER_MS) return EMPTY_OVERRIDES;
  try {
    const [{ default: dbConnect }, { default: SiteSettings }] = await Promise.all([
      import('@/lib/db/connect'),
      import('@/models/SiteSettings'),
    ]);
    await dbConnect();
    const docs = await SiteSettings.find({ key: { $in: Object.values(SITE_CONTENT_KEYS) } })
      .select('key value')
      .lean();
    const byKey = new Map(docs.map((d) => [d.key, d.value as unknown]));
    const images = byKey.get(SITE_CONTENT_KEYS.images);
    const text = byKey.get(SITE_CONTENT_KEYS.text);
    const links = byKey.get(SITE_CONTENT_KEYS.links);
    return {
      images: images && typeof images === 'object' && !Array.isArray(images) ? (images as ImageOverrides) : null,
      text: text && typeof text === 'object' && !Array.isArray(text) ? (text as SiteTextStore) : null,
      links: Array.isArray(links) && links.length > 0 ? (links as SiteLink[]) : null,
    };
  } catch (error) {
    lastFailureAt = Date.now();
    console.warn('[site-content] overrides unavailable, using defaults:', (error as Error)?.message ?? error);
    return EMPTY_OVERRIDES;
  }
});

/** Overrides saved from the admin (SiteSettings 'site-images'). */
async function loadImageOverrides(): Promise<ImageOverrides> {
  const { images } = await loadOverrides();
  if (!images) return {};
  const out: ImageOverrides = {};
  for (const key of Object.keys(IMAGE_SLOTS) as ImageSlotKey[]) {
    const o = images[key];
    if (!o || typeof o.src !== 'string' || !o.src) continue;
    const clean: Partial<SiteImage> = { src: o.src };
    if (typeof o.width === 'number' && o.width > 0) clean.width = o.width;
    if (typeof o.height === 'number' && o.height > 0) clean.height = o.height;
    if (typeof o.alt === 'string') clean.alt = o.alt;
    out[key] = clean;
  }
  return out;
}

export const getSiteImages = cache(async (): Promise<SiteImages> => {
  const overrides = await loadImageOverrides();
  const out = {} as SiteImages;
  for (const key of Object.keys(IMAGE_SLOTS) as ImageSlotKey[]) {
    const { src, width, height, alt } = IMAGE_SLOTS[key];
    out[key] = { src, width, height, alt, ...overrides[key] };
  }
  return out;
});

/** Link-in-bio list (copied from linktr.ee/riyadketami, 19 Oct 2026; Telegram removed). */
export interface SiteLink {
  key: string;
  label: string;
  url: string;
  partner?: boolean;
  /** Small logo/icon shown in the link row (site path or https URL). Optional. */
  icon?: string;
}

export const DEFAULT_LINKS: SiteLink[] = [
  { key: 'truecode', label: 'TrueCode Space · Formation IA & Automatisation (groupe du 1er novembre)', url: 'https://truecodespace.com', partner: true, icon: '/partners/truecode-icon.png' },
  { key: 'higgsfield', label: 'Open Higgsfield: generative video & image models via API', url: 'https://higgsfield.ai/s/hf-api-master-ig-riyadketami-dgQLll', partner: true, icon: '/partners/higgsfield-mark.svg' },
  { key: 'youtube', label: 'YouTube: AI in Darija', url: BRAND.youtubeUrl },
  { key: 'collab', label: `Collaborations: ${BRAND.email}`, url: BRAND.mailto },
];

/** Link list saved from the admin (SiteSettings 'site-links'), or null for the defaults. */
async function loadLinkOverrides(): Promise<SiteLink[] | null> {
  const { links } = await loadOverrides();
  if (!links) return null;
  const clean = links.filter(
    (l): l is SiteLink =>
      !!l && typeof l.key === 'string' && typeof l.label === 'string' && typeof l.url === 'string' && !!l.url
  );
  return clean.length > 0 ? clean : null;
}

export const getSiteLinks = cache(async (): Promise<SiteLink[]> => (await loadLinkOverrides()) ?? DEFAULT_LINKS);

/**
 * getDictionary(lang) with the admin's text overrides (SiteSettings 'site-text')
 * merged in by dot-path. Shape and types never change: unknown paths and
 * non-string targets are ignored.
 */
export const getSiteDictionary = cache(async (lang: Locale): Promise<Dictionary> => {
  const base = getDictionary(lang);
  const { text } = await loadOverrides();
  return applyTextOverrides(base, text?.[lang]);
});
