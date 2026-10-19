/**
 * Single source of truth for identity, links and socials.
 * Mirrors KETAMI_BRAND_REVIEW.md (brief) §1, §2.3, §5. Pure data — safe in
 * server and client components. Localised page copy lives in the dictionaries;
 * anything that must read the same in every locale lives here.
 *
 * Placeholders the brief marks [MISSING] / [VERIFY] stay `null` or carry a
 * `verified: false` flag so the UI can show them visibly instead of guessing.
 */

// [PENDING] Title second word (brief §1). Swap this one line when decided:
//   'AI Expert & Creative Entrepreneur' | 'AI Expert & Digital Creator'
const TITLE = 'AI Expert';

const PROOF_LINE = 'Co-founder, Algeria Business Bay';

const SITE_URL = 'https://ketami.net';
const EMAIL = 'riyad@ketami.net';

// Brief §5.4 — every ABB link carries this UTM set.
const ABB_UTM = 'utm_source=ketami.net&utm_medium=referral&utm_campaign=site';
const ABB_ROOT = 'https://www.algeriabusinessbay.com';

export type SocialKey =
  | 'tiktok'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'threads'
  | 'x';

export interface SocialLink {
  key: SocialKey;
  label: string;
  handle: string;
  url: string;
}

// Brief §5.3 — verified live 11 Oct 2026. LinkedIn is [MISSING]; Substack is parked.
const SOCIALS: SocialLink[] = [
  { key: 'tiktok', label: 'TikTok', handle: '@riyadketami', url: 'https://www.tiktok.com/@riyadketami' },
  { key: 'instagram', label: 'Instagram', handle: 'riyadketami', url: 'https://www.instagram.com/riyadketami/' },
  { key: 'facebook', label: 'Facebook', handle: 'riyadketami', url: 'https://www.facebook.com/riyadketami' },
  { key: 'youtube', label: 'YouTube', handle: '@RiyadKetami', url: 'https://www.youtube.com/@RiyadKetami' },
  { key: 'threads', label: 'Threads', handle: '@riyadketami', url: 'https://www.threads.com/@riyadketami' },
  { key: 'x', label: 'X', handle: 'riyadketami', url: 'https://x.com/riyadketami' },
];

const socialUrl = (key: SocialKey) => SOCIALS.find((s) => s.key === key)!.url;

/** `<title>` form per brief §5.1, built from the constants above. */
function headTitle(name: string, title: string, proof: string): string {
  // A compound title ("AI Expert & Creative Entrepreneur") already has its "&",
  // so the proof line joins with a middot instead of stacking a second "&".
  return title.includes('&') ? `${name} · ${title} · ${proof}` : `${name} · ${title} & ${proof}`;
}

export const BRAND = {
  name: 'Riyad Ketami',
  wordmark: 'RIYAD KETAMI',
  monogram: 'RK',
  title: TITLE,
  proofLine: PROOF_LINE,
  headTitle: headTitle('Riyad Ketami', TITLE, PROOF_LINE),
  /** Mono hero eyebrow (brief §2.3). Same in every locale. */
  eyebrow: `${TITLE} · ${PROOF_LINE} · Oran, Algeria`.toUpperCase(),
  tagline: 'Built in Algeria. Built for the world.',
  claim: 'AI بالدارجة',
  /** About section only — never a headline (brief §1). */
  manifesto: 'Attention is the code. Connection is the key.',
  heroArabic: 'نخلّي الـAI يخدم البزنس تاعك، بالدارجة.',
  description:
    'AI expert and co-founder of Algeria Business Bay. Riyad Ketami makes AI work for Algerian and MENA business, in Darija.',
  url: SITE_URL,
  email: EMAIL,
  mailto: `mailto:${EMAIL}`,
  speakMailto: `mailto:${EMAIL}?subject=${encodeURIComponent('Speaking invitation')}`,
  location: { city: 'Oran', country: 'Algeria', countryCode: 'DZ' },
  languages: ['ar', 'fr', 'en'],

  abb: {
    name: 'Algeria Business Bay',
    rootUrl: ABB_ROOT,
    url: `${ABB_ROOT}/?${ABB_UTM}`,
    cofounder: 'Larbi',
    // [VERIFY with ABB before launch] — read from algeriabusinessbay.com on 11 Oct 2026.
    stats: {
      verified: false,
      source: 'algeriabusinessbay.com, 11 Oct 2026',
      values: { companies: 233, wilayas: 69, communities: 101 },
    },
  },

  socials: SOCIALS,
  youtubeUrl: socialUrl('youtube'),
  /** [MISSING: LinkedIn URL] — add here and it flows to quick links, footer and sameAs. */
  linkedinUrl: null as string | null,
  /** [MISSING: media kit URL] */
  mediaKitUrl: null as string | null,
  /** Quick link 3 — "This week's tool". Max one, always labelled PARTNER. [sponsor URL] */
  partnerLink: null as { label: string; url: string } | null,

  // "Trusted by AI teams": delivered collaborations only, verified 19 Oct 2026 against
  // the production folders in Documents/04 - Collaborations (2026). Dreamina kept per
  // Riyad (13 Oct 2026). Not listed until delivered: Lovart, PixVerse, CapCut, Airia,
  // TrueCode Space (in production). Logos are the brands' own files, never AI-drawn
  // (brief §6.2). Names only, no logos, until each brand gives written OK to show its logo
  // (Riyad, 19 Oct 2026); `logo` takes the official file path once approved.
  partners: [
    { name: 'Kimi', logo: null },
    { name: 'ByteDance', logo: null }, // Dreamina + Pippit campaigns (Dreamina via agency GrowMaxValue)
    { name: 'Dreamina', logo: null },
    { name: 'Genspark', logo: null },
    { name: 'Higgsfield', logo: null },
    { name: 'Pollo AI', logo: null },
    { name: 'Skywork', logo: null },
    { name: 'Emergent', logo: null },
  ] as ReadonlyArray<{ name: string; logo: string | null; width?: number; height?: number }>,

  images: {
    // Kit assets (brief §6.1) live in /public/brand
    avatar: '/brand/profile-picture_800.v5.jpg',
    og: '/brand/og-image_1200x630.v5.jpg',
    // A05 (hero_2816x1584.jpg) stays in public/brand as a kit asset; V08 is the desktop hero
    // A07 (hero-vertical) stays in public/brand as a kit asset; V01 is the mobile hero
    oranPlate: '/brand/oran-plate_2816x1584.jpg',
    speakerCard: '/brand/story-speaker-card_1080x1920.jpg',
  },

  /**
   * Generated visuals (brief §6.2). v4 (19 Oct 2026): V01, V02, V03, V05, V08 by grok-imagine-2
   * from Riyad's real photos (Pictures/KETAMI-Brand-Kit/ref-website-2026); V04 is a real
   * WebExpo stage photo. v3 is archived in Pictures/KETAMI-Brand-Kit/archive-website-visuals-v3.
   * `approved` records Riyad's likeness sign-off (brief §6.4 step 1) — flip it
   * per image once approved; nothing here should ship before that.
   */
  visuals: {
    V01: { src: '/brand/V01_mobile-hero.v5.jpg', width: 1440, height: 1920, alt: 'Riyad Ketami, studio portrait', approved: false },
    V02: { src: '/brand/V02_card-darija.v4.jpg', width: 1920, height: 1440, alt: 'Riyad recording an AI breakdown at his desk', approved: false },
    V03: { src: '/brand/V03_card-launch.v4.jpg', width: 1920, height: 1440, alt: 'Riyad filming himself with his phone', approved: false },
    V04: { src: '/brand/V04_card-talks.v4.jpg', width: 1920, height: 1440, alt: 'Riyad speaking on stage at WebExpo', approved: false },
    V05: { src: '/brand/V05_about-oran.v5.jpg', width: 1920, height: 1280, alt: 'Riyad on the Oran seafront', approved: false },
    // V08 (new slot): desktop hero in the same Flux set, so desktop and mobile match.
    // Kit A05 (hero_2816x1584.jpg) remains in public/brand as the fallback.
    V08: { src: '/brand/V08_desktop-hero.v6.jpg', width: 1920, height: 1080, alt: 'Riyad Ketami, studio portrait', approved: false },
    V06: { src: '/brand/V06_abb-texture.jpg', width: 2816, height: 1584, alt: '', approved: false },
  },
} as const;

/** Every profile Google should tie to the name (brief §5.2 sameAs). */
export function sameAs(): string[] {
  return [...SOCIALS.map((s) => s.url), ...(BRAND.linkedinUrl ? [BRAND.linkedinUrl] : [])];
}

/** Person JSON-LD, brief §5.2. */
export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${BRAND.url}/#person`,
    name: BRAND.name,
    jobTitle: BRAND.title,
    description:
      'AI expert and co-founder of Algeria Business Bay, making AI work for Algerian and MENA business in Darija.',
    url: BRAND.url,
    image: `${BRAND.url}/brand/profile-picture_800.v5.jpg`,
    email: BRAND.mailto,
    address: {
      '@type': 'PostalAddress',
      addressLocality: BRAND.location.city,
      addressCountry: BRAND.location.countryCode,
    },
    worksFor: {
      '@type': 'Organization',
      name: BRAND.abb.name,
      url: BRAND.abb.rootUrl,
    },
    knowsLanguage: [...BRAND.languages],
    sameAs: sameAs(),
  };
}
