import {
  Inter,
  Inter_Tight,
  JetBrains_Mono,
  IBM_Plex_Sans_Arabic,
  Tajawal,
  Cairo,
} from 'next/font/google';

export const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  weight: ['300', '400', '700'],
});

// Arabic display font — used for headlines in AR locale (900 Black)
export const tajawal = Tajawal({
  subsets: ['arabic'],
  variable: '--font-tajawal',
  display: 'swap',
  weight: ['400', '700', '800', '900'],
});

// Arabic body/nav font
export const cairo = Cairo({
  subsets: ['arabic'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '600', '700'],
});
