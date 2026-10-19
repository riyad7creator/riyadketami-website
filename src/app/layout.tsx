import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { spaceGrotesk, jetbrainsMono, ibmPlexArabic } from '@/lib/fonts';
import { ClarityScript } from '@/components/ClarityScript';
import { BRAND } from '@/lib/brand';
import './globals.css';

// Brief §5.1. Every identity string comes from BRAND, so the [PENDING] title
// swap in src/lib/brand.ts updates <title>, OG and Twitter in one go.
export const metadata: Metadata = {
  title: {
    default: BRAND.headTitle,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  metadataBase: new URL(BRAND.url),
  openGraph: {
    type: 'profile',
    siteName: BRAND.name,
    title: BRAND.headTitle,
    description: BRAND.description,
    url: BRAND.url,
    images: [{ url: BRAND.images.og, width: 1200, height: 630, alt: `${BRAND.name}, ${BRAND.title}, ${BRAND.proofLine}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND.headTitle,
    description: BRAND.description,
    images: [BRAND.images.og],
  },
  keywords: [BRAND.name, BRAND.title, BRAND.abb.name, 'AI Darija', 'AI بالدارجة', 'AI Algeria', 'AI MENA', 'Oran'],
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
        jetbrainsMono.variable,
        ibmPlexArabic.variable,
      ].join(' ')}
    >
      <body suppressHydrationWarning>
        {children}
        <ClarityScript />
      </body>
    </html>
  );
}
