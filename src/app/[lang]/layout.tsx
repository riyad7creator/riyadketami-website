import type { Metadata } from 'next';
import { locales } from '@/i18n/config';

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
      languages: { en: '/en', fr: '/fr', ar: '/ar' },
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
  await params;
  return <>{children}</>;
}
