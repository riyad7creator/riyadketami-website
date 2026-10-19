import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getSiteDictionary } from '@/lib/site-content';
import { localizedAlternates } from '@/lib/seo';
import Eyebrow from '@/components/ui/Eyebrow';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getSiteDictionary(lang);
  return {
    title: dict.newsletter.privacy.meta_title,
    description: dict.newsletter.privacy.meta_description,
    alternates: localizedAlternates(lang, 'privacy'),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = await getSiteDictionary(lang);
  const t = dict.newsletter.privacy;
  return (
    <section className="px-4 pb-24 pt-32 sm:px-8">
      <div className="mx-auto flex max-w-[720px] flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Eyebrow>{dict.newsletter.privacy_nav}</Eyebrow>
          <h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-bold leading-[1.1] text-paper">{t.title}</h1>
          <p className="font-mono text-xs text-text-2">{t.updated}</p>
        </header>
        {t.sections.map((s) => (
          <section key={s.h} className="flex flex-col gap-2">
            <h2 className="font-display text-xl font-bold text-paper">{s.h}</h2>
            <p className="leading-relaxed text-text-1">{s.p}</p>
          </section>
        ))}
      </div>
    </section>
  );
}
