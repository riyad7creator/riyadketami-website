import type { Metadata } from 'next';
import { headers } from 'next/headers';
import {
  spaceGrotesk,
  montserrat,
  jetbrainsMono,
  ibmPlexArabic,
  cairo,
  arefRuqaa,
  permanentMarker,
} from '@/lib/fonts';
import { ClarityScript } from '@/components/ClarityScript';
import ScrollControl from '@/components/ScrollControl';
import MotionProvider from '@/components/MotionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Riyad Ketami',
    template: '%s | Riyad Ketami',
  },
  description: 'AI educator, digital strategist, and content creator. 36.4M+ impressions a quarter across MENA. Bridging global AI and the MENA creator economy.',
  metadataBase: new URL('https://riyadketami.com'),
  openGraph: {
    type: 'website',
    siteName: 'Riyad Ketami',
    title: 'Riyad Ketami — Built in Algeria. Built for the world.',
    description: 'AI educator and digital strategist. 36.4M+ impressions, 1.4M+ engagements. Bridging global AI and the MENA creator economy.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Riyad Ketami — Built in Algeria. Built for the world.',
    description: 'AI educator and digital strategist. 36.4M+ impressions, 1.4M+ engagements. Bridging global AI and the MENA creator economy.',
  },
  icons: {
    icon: '/favicon.ico',
  },
  keywords: ['Riyad Ketami', 'AI educator', 'digital strategist', 'AI consultant Algeria', 'AI MENA', 'Darija AI', 'content creator Algeria', 'TikTok', 'newsletter'],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const locale = headersList.get('x-locale') ?? 'en';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={[
        spaceGrotesk.variable,
        montserrat.variable,
        jetbrainsMono.variable,
        ibmPlexArabic.variable,
        cairo.variable,
        arefRuqaa.variable,
        permanentMarker.variable,
      ].join(' ')}
    >
      <body suppressHydrationWarning>
        <ScrollControl />
        <MotionProvider>{children}</MotionProvider>
        <ClarityScript />
      </body>
    </html>
  );
}
