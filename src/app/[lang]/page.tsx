import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { getHomeData } from '@/lib/home-data';
import Hero from '@/components/home/Hero';
import FollowerStrip from '@/components/home/FollowerStrip';
import AboutTeaser from '@/components/home/AboutTeaser';
import ConsultingPreview from '@/components/home/ConsultingPreview';
import BlogTeaser from '@/components/home/BlogTeaser';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Riyad Ketami',
  description: 'Builder. Strategist. Operator.',
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const { socials, posts } = await getHomeData(lang);

  return (
    <>
      <Hero locale={lang} dict={dict} />
      <FollowerStrip lang={lang} dict={dict} entries={socials} />
      <AboutTeaser locale={lang} dict={dict} />
      <ConsultingPreview locale={lang} dict={dict} />
      <BlogTeaser locale={lang} dict={dict} posts={posts} />
    </>
  );
}
