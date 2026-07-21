import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { interTight, inter, jetbrainsMono, ibmPlexArabic, tajawal, cairo } from '@/lib/fonts';
import { ClarityScript } from '@/components/ClarityScript';
import { SITE_URL } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Riyad Ketami',
    template: '%s | Riyad Ketami',
  },
  description: 'Digital entrepreneur, AI consultant, and content creator with a 400K+ community. Building in public since day one.',
  metadataBase: new URL(SITE_URL),
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

  // Only reference the Arabic font variables when the locale needs them — next/font
  // auto-preloads any font whose `.variable` appears in the render tree, so including
  // these unconditionally forces Cairo/Tajawal/IBM-Plex downloads on EN/FR pages too.
  const fontVariables = [
    interTight.variable,
    inter.variable,
    jetbrainsMono.variable,
    ...(locale === 'ar' ? [ibmPlexArabic.variable, tajawal.variable, cairo.variable] : []),
  ];

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={fontVariables.join(' ')}
    >
      <body suppressHydrationWarning>
        {children}
        <ClarityScript />
      </body>
    </html>
  );
}
