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
import MotionProvider from '@/components/MotionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Riyad Ketami',
    template: '%s | Riyad Ketami',
  },
  description: 'Digital entrepreneur, AI consultant, and content creator with a 400K+ community. Building in public since day one.',
  metadataBase: new URL('https://riyadketami.com'),
  openGraph: {
    type: 'website',
    siteName: 'Riyad Ketami',
    title: 'Riyad Ketami: Builder. Creator. Entrepreneur.',
    description: 'Digital entrepreneur, AI consultant, and content creator with a 400K+ community.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Riyad Ketami: Builder. Creator. Entrepreneur.',
    description: 'Digital entrepreneur, AI consultant, and content creator with a 400K+ community.',
  },
  icons: {
    icon: '/favicon.ico',
  },
  keywords: ['Riyad Ketami', 'AI consultant', 'digital entrepreneur', 'content creator', 'consulting', 'TikTok', 'newsletter'],
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
        <MotionProvider>{children}</MotionProvider>
        <ClarityScript />
      </body>
    </html>
  );
}
