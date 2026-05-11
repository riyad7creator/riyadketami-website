import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { interTight, inter, jetbrainsMono, ibmPlexArabic, tajawal, cairo } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Riyad Ketami',
    template: '%s — Riyad Ketami',
  },
  description: 'Digital entrepreneur, AI consultant, and content creator with a 400K+ community. Building in public since day one.',
  metadataBase: new URL('https://riyadketami.com'),
  openGraph: {
    type: 'website',
    siteName: 'Riyad Ketami',
    title: 'Riyad Ketami — Builder. Creator. Entrepreneur.',
    description: 'Digital entrepreneur, AI consultant, and content creator with a 400K+ community.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Riyad Ketami — Builder. Creator. Entrepreneur.',
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
        interTight.variable,
        inter.variable,
        jetbrainsMono.variable,
        ibmPlexArabic.variable,
        tajawal.variable,
        cairo.variable,
      ].join(' ')}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
