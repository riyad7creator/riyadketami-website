import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';
import { isValidLocale } from '@/i18n/config';
import { getSiteDictionary } from '@/lib/site-content';
import { localizedAlternates } from '@/lib/seo';
import Eyebrow from '@/components/ui/Eyebrow';
import NewsletterForm from '@/components/newsletter/NewsletterForm';
import { getNewsletterSettings } from '@/lib/newsletter/config';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getSiteDictionary(lang);
  return {
    title: dict.newsletter.subscribe.meta_title,
    description: dict.newsletter.subscribe.meta_description,
    alternates: localizedAlternates(lang, 'subscribe'),
  };
}

/** Focused signup page for bio links and video calls to action (UTM tags are stored) */
export default async function SubscribePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = await getSiteDictionary(lang);
  const t = dict.newsletter.subscribe;
  const settings = await getNewsletterSettings();
  const magnet = settings.leadMagnet[lang] ?? null;

  return (
    <section className="px-4 pb-24 pt-32 sm:px-8">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <Eyebrow text={t.eyebrow} />
        <h1 className="font-display text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.08] text-paper">{t.title}</h1>
        <p className="text-base leading-relaxed text-text-1 sm:text-lg">{t.subtitle}</p>
        <ul className="flex flex-col gap-3">
          {t.points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-text-1">
              <Check size={18} className="mt-0.5 shrink-0 text-signal" aria-hidden />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        {magnet?.title && (
          <p className="rounded-[var(--radius-md)] border border-signal/30 bg-signal/[0.06] px-4 py-3 text-sm text-text-0">
            <span className="font-semibold text-signal">{t.lead_magnet_prefix}</span> {magnet.title}
          </p>
        )}
        <NewsletterForm dict={dict} locale={lang} variant="stacked" source="subscribe-page" className="pt-2" />
        <p className="font-mono text-xs text-text-2">{t.note}</p>
        <Link href={`/${lang}/newsletter`} className="w-fit text-sm text-text-1 underline underline-offset-4 hover:text-signal">
          {t.archive_link}
        </Link>
      </div>
    </section>
  );
}
