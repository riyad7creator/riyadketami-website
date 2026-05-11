import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { locales, isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { NavBar, Footer, PageTransition } from '@/components/ui';

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const headersList = await headers();
  // Extract the path segment after the locale prefix (e.g. /en/services → /services)
  const nextUrl = headersList.get('next-url') ?? `/${lang}`;
  const suffix = nextUrl.replace(new RegExp(`^/${lang}`), '') || '';

  return {
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}${suffix}`])),
      canonical: `/${lang}${suffix}`,
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const dict = getDictionary(lang);

  const navItems = [
    { label: dict.nav.about, href: `/${lang}/about` },
    { label: dict.nav.blog, href: `/${lang}/blog` },
    { label: dict.nav.services, href: `/${lang}/services` },
    { label: dict.nav.contact, href: `/${lang}/contact` },
  ];

  return (
    <>
      <link rel="preload" as="image" href="/portraits/portrait-hero.png" fetchPriority="high" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[var(--z-toast)] focus:px-4 focus:py-2 focus:bg-matrix focus:text-bg-0 focus:text-sm focus:font-medium focus:rounded-[var(--radius-md)]"
      >
        Skip to content
      </a>
      <NavBar locale={lang} items={navItems} />
      <main id="main-content" className="min-h-[100dvh]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer locale={lang} />
    </>
  );
}
