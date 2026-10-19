import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getSiteDictionary } from '@/lib/site-content';
import { localizedAlternates } from '@/lib/seo';
import Eyebrow from '@/components/ui/Eyebrow';
import NewsletterForm from '@/components/newsletter/NewsletterForm';
import { getArchive } from '@/lib/newsletter/archive';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = await getSiteDictionary(lang);
  return {
    title: dict.newsletter.archive.meta_title,
    description: dict.newsletter.archive.meta_description,
    alternates: localizedAlternates(lang, 'newsletter'),
  };
}

export default async function NewsletterArchivePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = await getSiteDictionary(lang);
  const t = dict.newsletter.archive;
  const issues = await getArchive(lang);
  const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : lang, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <section className="px-4 pb-24 pt-32 sm:px-8">
      <div className="mx-auto flex max-w-[760px] flex-col gap-10">
        <header className="flex flex-col gap-4">
          <Eyebrow text={t.eyebrow} />
          <h1 className="font-display text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.08] text-paper">{t.title}</h1>
          <p className="text-base leading-relaxed text-text-1 sm:text-lg">{t.subtitle}</p>
        </header>

        {issues.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-line px-5 py-6 text-text-1">{t.empty}</p>
        ) : (
          <ol className="flex flex-col divide-y divide-line border-y border-line">
            {issues.map((i) => (
              <li key={i.slug}>
                <Link href={`/${lang}/newsletter/${i.slug}`} className="group flex flex-col gap-1.5 py-5">
                  <time dateTime={i.sentAt} className="font-mono text-xs text-text-2">{fmt.format(new Date(i.sentAt))}</time>
                  <span className="font-display text-xl font-bold text-paper group-hover:text-signal">{i.subject}</span>
                  {i.previewText && <span className="text-sm text-text-1">{i.previewText}</span>}
                </Link>
              </li>
            ))}
          </ol>
        )}

        <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-line bg-panel p-6">
          <p className="font-display text-lg font-bold text-paper">{t.subscribe_title}</p>
          <NewsletterForm dict={dict} locale={lang} variant="inline" source="archive" />
        </div>
      </div>
    </section>
  );
}
