import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getSiteDictionary } from '@/lib/site-content';
import { getHomeData } from '@/lib/home-data';
import { jsonLdString } from '@/lib/json-ld';
import { localizedAlternates } from '@/lib/seo';
import { personJsonLd } from '@/lib/brand';
import Hero from '@/components/home/Hero';
import NowStrip from '@/components/home/NowStrip';
import WhatIDo from '@/components/home/WhatIDo';
import AbbSection from '@/components/home/AbbSection';
import TrustedBy from '@/components/home/TrustedBy';
import AboutTeaser from '@/components/home/AboutTeaser';
import ContactSection from '@/components/home/ContactSection';
import BlogTeaser from '@/components/home/BlogTeaser';
import NewsletterSection from '@/components/home/NewsletterSection';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getSiteDictionary(lang);
  // No title: home inherits the root default, the full brand title (brief §5.1)
  return {
    description: dict.meta.home_description,
    alternates: localizedAlternates(lang, ''),
  };
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const dict = await getSiteDictionary(lang);
  const { posts } = await getHomeData(lang);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(personJsonLd()) }} />
      {/* Section order: brief §2.3 */}
      <Hero locale={lang} dict={dict} />
      <NowStrip dict={dict} />
      <WhatIDo dict={dict} />
      <AbbSection dict={dict} />
      <TrustedBy dict={dict} />
      <AboutTeaser locale={lang} dict={dict} />
      <ContactSection dict={dict} />
      <BlogTeaser locale={lang} dict={dict} posts={posts} />
      <NewsletterSection dict={dict} locale={lang} />
    </>
  );
}
