import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { ArrowLeft } from 'lucide-react';
import { isValidLocale } from '@/i18n/config';
import { getSiteDictionary } from '@/lib/site-content';
import NewsletterForm from '@/components/newsletter/NewsletterForm';
import { getIssue } from '@/lib/newsletter/archive';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isValidLocale(lang)) return {};
  const issue = await getIssue(slug, lang);
  if (!issue) return { title: 'Not found' };
  const languages = Object.fromEntries(issue.languages.map((l) => [l, `/${l}/newsletter/${issue.slug}`]));
  return {
    title: issue.subject,
    description: issue.previewText,
    alternates: {
      // An issue shown in English on a French URL points search engines at the English page
      canonical: `/${issue.lang}/newsletter/${issue.slug}`,
      languages,
    },
    openGraph: { type: 'article', title: issue.subject, description: issue.previewText, publishedTime: issue.sentAt },
  };
}

export default async function NewsletterIssuePage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isValidLocale(lang)) notFound();
  const issue = await getIssue(slug, lang);
  if (!issue) notFound();
  const dict = await getSiteDictionary(lang);
  const t = dict.newsletter.archive;
  const clean = DOMPurify.sanitize(issue.bodyHtml, { FORBID_TAGS: ['style', 'script', 'iframe', 'form'], FORBID_ATTR: ['style'] });
  const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : lang, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <article className="px-4 pb-24 pt-32 sm:px-8">
      <div className="mx-auto flex max-w-[720px] flex-col gap-8">
        <Link href={`/${lang}/newsletter`} className="inline-flex w-fit items-center gap-2 text-sm text-text-2 hover:text-signal">
          <ArrowLeft size={14} className="rtl:rotate-180" aria-hidden /> {t.back}
        </Link>
        <header className="flex flex-col gap-3" lang={issue.lang} dir={issue.lang === 'ar' ? 'rtl' : 'ltr'}>
          <time dateTime={issue.sentAt} className="font-mono text-xs text-text-2">{fmt.format(new Date(issue.sentAt))}</time>
          <h1 className="font-display text-[clamp(1.9rem,5vw,3rem)] font-bold leading-[1.1] text-paper">{issue.subject}</h1>
        </header>
        <div
          lang={issue.lang}
          dir={issue.lang === 'ar' ? 'rtl' : 'ltr'}
          className="prose prose-invert sm:prose-lg max-w-none prose-headings:font-display prose-headings:text-text-0 prose-p:text-text-1 prose-li:text-text-1 prose-a:text-matrix prose-a:underline prose-a:underline-offset-2 prose-blockquote:border-matrix/40"
          dangerouslySetInnerHTML={{ __html: clean }}
        />
        <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-line bg-panel p-6">
          <p className="font-display text-lg font-bold text-paper">{t.subscribe_title}</p>
          <NewsletterForm dict={dict} locale={lang} variant="inline" source="archive" />
        </div>
      </div>
    </article>
  );
}
