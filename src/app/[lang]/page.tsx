import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { getHomeData } from '@/lib/home-data';
import Hero from '@/components/home/Hero';
import FollowerStrip from '@/components/home/FollowerStrip';
import ServicesSection from '@/components/home/ServicesSection';
import AboutTeaser from '@/components/home/AboutTeaser';
import NewsletterSection from '@/components/home/NewsletterSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import BlogTeaser from '@/components/home/BlogTeaser';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Builder. Creator. Entrepreneur.',
  description: 'Digital entrepreneur, AI consultant, and content creator. 400K+ community.',
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Riyad Ketami',
  url: 'https://riyadketami.com',
  jobTitle: 'Digital Entrepreneur & AI Consultant',
  description: 'Digital entrepreneur, AI consultant, and content creator with 400K+ community.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Hero locale={lang} dict={dict} socials={socials} />
      <FollowerStrip lang={lang} dict={dict} entries={socials} />
      <ServicesSection locale={lang} dict={dict} />
      <AboutTeaser locale={lang} dict={dict} />
      <NewsletterSection dict={dict} />
      <TestimonialsSection dict={dict} />
      <BlogTeaser locale={lang} dict={dict} posts={posts} />
    </>
  );
}
