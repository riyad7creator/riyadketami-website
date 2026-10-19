import { Space_Grotesk, JetBrains_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google';

/**
 * KETAMI_BRAND_REVIEW.md §3.2 — three faces, nothing else.
 *   Space Grotesk        → display and UI (400/500/700)
 *   JetBrains Mono       → eyebrows, labels, email, URLs (400/500)
 *   IBM Plex Sans Arabic → every Arabic run (500/600). The brand face is the
 *     licensed Montserrat Arabic, which is not on Google Fonts; swap in via
 *     next/font/local once the licensed file is supplied.
 */

// Variable font: one file covers the 400/500/700 the brief calls for.
export const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display-face',
  display: 'swap',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false, // eyebrows only: never worth delaying first paint
  weight: ['400', '500'],
});

export const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false, // swaps in; English/French LCP no longer waits on Arabic glyphs
  weight: ['500', '600'],
});
