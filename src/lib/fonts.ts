import {
  Space_Grotesk,
  Montserrat,
  JetBrains_Mono,
  IBM_Plex_Sans_Arabic,
  Cairo,
  Aref_Ruqaa,
  Permanent_Marker,
} from 'next/font/google';

/**
 * KETAMI Brand Identity Book v1.0 — sections 06 (Typography Core) and
 * 07 (Rule-Breakers).
 *
 * Division of labour, per the book:
 *   Space Grotesk  → documents, decks, UI display ("the machine")
 *   JetBrains Mono → terminal lines, labels, stats, @riyadketami
 *   Montserrat     → everything the audience reads as content
 *   Aref Ruqaa / Permanent Marker → accents only, max ONE per composition
 */

// System display — wordmark and UI headings (Bold, caps, tracking 0)
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display-face',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

// Content — the Latin twin of Montserrat Arabic
export const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans-face',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

// Terminal / system mono
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

/**
 * Arabic content face.
 *
 * The book specifies Montserrat Arabic, which is licensed and not available
 * through next/font/google — the book itself notes its Arabic specimens are
 * "rendered in a proxy; production uses licensed Montserrat Arabic". Cairo is
 * the closest geometric match available here and preserves the book's
 * "Arabic + Latin share one geometry" requirement. Replace with the licensed
 * file via next/font/local once supplied.
 */
export const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-arabic-body',
  display: 'swap',
  weight: ['400', '600', '700', '900'],
});

// Arabic fallback for terminal lines (JetBrains Mono carries no Arabic)
export const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  weight: ['300', '400', '700'],
});

// Rule-breaker: Arabic handwriting — one-word emotional punches only
export const arefRuqaa = Aref_Ruqaa({
  subsets: ['arabic'],
  variable: '--font-ruqaa',
  display: 'swap',
  weight: ['400', '700'],
});

// Rule-breaker: Latin marker scrawl — short rebel phrases only
export const permanentMarker = Permanent_Marker({
  subsets: ['latin'],
  variable: '--font-marker',
  display: 'swap',
  weight: ['400'],
});
