import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { getHomeData } from '@/lib/home-data';
import { jsonLdString } from '@/lib/json-ld';
import { localizedAlternates } from '@/lib/seo';
import Hero from '@/components/home/Hero';
import FollowerStrip from '@/components/home/FollowerStrip';
import ServicesSection from '@/components/home/ServicesSection';
import AboutTeaser from '@/components/home/AboutTeaser';
import NewsletterSection from '@/components/home/NewsletterSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import BlogTeaser from '@/components/home/BlogTeaser';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: 'Built in Algeria. Built for the world.',
    description: 'AI educator and digital strategist. I help global AI companies reach the MENA market, and I help MENA founders build with AI before everyone else does.',
    alternates: localizedAlternates(lang, ''),
  };
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Riyad Ketami',
  url: 'https://riyadketami.com',
  jobTitle: 'AI Educator & Digital Strategist',
  description: 'AI educator, digital strategist, and content creator from Algeria. 470K+ followers across platforms.',
  sameAs: [
    'https://tiktok.com/@riyadketami',
    'https://youtube.com/@riyadketami',
    'https://instagram.com/riyadketami',
  ],
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const { socials, posts } = await getHomeData(lang);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(personJsonLd) }}
      />
      <Hero locale={lang} dict={dict} socials={socials} />
      <FollowerStrip lang={lang} dict={dict} entries={socials} />
      <ServicesSection locale={lang} dict={dict} />
      <AboutTeaser locale={lang} dict={dict} />
      <NewsletterSection dict={dict} locale={lang} />
      <TestimonialsSection dict={dict} />
      <BlogTeaser locale={lang} dict={dict} posts={posts} />
    </>
  );
}
