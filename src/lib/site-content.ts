import { cache } from 'react';
import { BRAND } from '@/lib/brand';

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

/** Overrides saved from the admin. Wired to MongoDB in loadImageOverrides(). */
async function loadImageOverrides(): Promise<Partial<Record<ImageSlotKey, Partial<SiteImage>>>> {
  return {};
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
}

export const DEFAULT_LINKS: SiteLink[] = [
  { key: 'truecode', label: 'TrueCode Space · Formation IA & Automatisation (groupe du 1er novembre)', url: 'https://truecodespace.com', partner: true },
  { key: 'higgsfield', label: 'Open Higgsfield: generative video & image models via API', url: 'https://higgsfield.ai/s/hf-api-master-ig-riyadketami-dgQLll', partner: true },
  { key: 'youtube', label: 'YouTube: AI in Darija', url: BRAND.youtubeUrl },
  { key: 'collab', label: `Collaborations: ${BRAND.email}`, url: BRAND.mailto },
];

async function loadLinkOverrides(): Promise<SiteLink[] | null> {
  return null;
}

export const getSiteLinks = cache(async (): Promise<SiteLink[]> => (await loadLinkOverrides()) ?? DEFAULT_LINKS);
