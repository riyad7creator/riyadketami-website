import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getSiteDictionary } from '@/lib/site-content';
import Eyebrow from '@/components/ui/Eyebrow';
import { getNewsletterSettings } from '@/lib/newsletter/config';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ConfirmedPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = await getSiteDictionary(lang);
  const t = dict.newsletter.confirmed;
  const settings = await getNewsletterSettings();
  const magnet = settings.leadMagnet[lang] ?? settings.leadMagnet.en;

  return (
    <section className="px-4 pb-24 pt-32 sm:px-8">
      <div className="mx-auto flex max-w-[560px] flex-col gap-5">
        <Eyebrow text={dict.home.newsletter.eyebrow} />
        <h1 className="font-display text-3xl font-bold text-paper sm:text-4xl">{t.title}</h1>
        <p className="text-text-1">{t.body}</p>
        {magnet?.url && magnet.title && (
          <p className="rounded-[var(--radius-md)] border border-signal/30 bg-signal/[0.06] px-4 py-3 text-sm text-text-0">
            <span className="font-semibold text-signal">{t.lead_magnet}</span>{' '}
            <a href={magnet.url} target="_blank" rel="noopener" className="underline hover:text-signal">{magnet.title}</a>
          </p>
        )}
        <Link href={`/${lang}/blog`} className="w-fit rounded-[var(--radius-md)] bg-matrix px-6 py-3 text-sm font-semibold text-bg-0 hover:bg-matrix/90">
          {t.back_blog}
        </Link>
      </div>
    </section>
  );
}
