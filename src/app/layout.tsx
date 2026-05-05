import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { interTight, inter, jetbrainsMono, ibmPlexArabic } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Riyad Ketami',
    template: '%s — Riyad Ketami',
  },
  description: 'Builder. Strategist. Operator. I help ambitious teams build what they mean to build.',
  metadataBase: new URL('https://riyadketami.com'),
  openGraph: {
    type: 'website',
    siteName: 'Riyad Ketami',
    title: 'Riyad Ketami',
    description: 'Builder. Strategist. Operator.',
    images: [{ url: '/portraits/portrait-hero.png', width: 1200, height: 630, alt: 'Riyad Ketami' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Riyad Ketami',
    description: 'Builder. Strategist. Operator.',
    images: ['/portraits/portrait-hero.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
  keywords: ['Riyad Ketami', 'consulting', 'product strategy', 'AI', 'full-stack'],
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
        interTight.variable,
        inter.variable,
        jetbrainsMono.variable,
        ibmPlexArabic.variable,
      ].join(' ')}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
