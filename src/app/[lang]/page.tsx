import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { getHomeData } from '@/lib/home-data';
import Hero from '@/components/home/Hero';
import FollowerStrip from '@/components/home/FollowerStrip';
import LinksSection from '@/components/home/LinksSection';
import NewsletterSection from '@/components/home/NewsletterSection';
import SpeakingCTA from '@/components/home/SpeakingCTA';
import AboutTeaser from '@/components/home/AboutTeaser';
import ProductsSection from '@/components/home/ProductsSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import ConsultingPreview from '@/components/home/ConsultingPreview';
import BlogTeaser from '@/components/home/BlogTeaser';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Riyad Ketami',
  description: 'Digital entrepreneur, AI consultant, and content creator. 400K+ community.',
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const { socials, posts, links } = await getHomeData(lang);

  return (
    <>
      <Hero locale={lang} dict={dict} socials={socials} />
      <FollowerStrip lang={lang} dict={dict} entries={socials} />
      <LinksSection links={links} dict={dict} />
      <NewsletterSection dict={dict} />
      <SpeakingCTA locale={lang} dict={dict} />
      <AboutTeaser locale={lang} dict={dict} />
      <ProductsSection locale={lang} dict={dict} />
      <TestimonialsSection dict={dict} />
      <ConsultingPreview locale={lang} dict={dict} />
      <BlogTeaser locale={lang} dict={dict} posts={posts} />
    </>
  );
}
