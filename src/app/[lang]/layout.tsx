import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { NavBar, Footer } from '@/components/ui';

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
      canonical: `/${lang}`,
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
    { label: dict.nav.consulting, href: `/${lang}/consulting` },
    { label: dict.nav.contact, href: `/${lang}/contact` },
  ];

  return (
    <>
      <link rel="preload" as="image" href="/portraits/portrait-hero.png" fetchPriority="high" />
      <NavBar locale={lang} items={navItems} />
      <main className="min-h-[100dvh]">{children}</main>
      <Footer locale={lang} />
    </>
  );
}
