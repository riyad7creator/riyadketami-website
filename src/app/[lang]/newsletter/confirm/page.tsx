import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getSiteDictionary } from '@/lib/site-content';
import Eyebrow from '@/components/ui/Eyebrow';
import ConfirmForm from '@/components/newsletter/ConfirmForm';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ e?: string; t?: string; error?: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const { e, t: token, error } = await searchParams;
  const dict = await getSiteDictionary(lang);
  const t = dict.newsletter.confirm;
  const valid = !error && typeof e === 'string' && typeof token === 'string' && e.length < 255 && token.length < 200;

  return (
    <section className="px-4 pb-24 pt-32 sm:px-8">
      <div className="mx-auto flex max-w-[560px] flex-col gap-5">
        <Eyebrow text={dict.home.newsletter.eyebrow} />
        {valid ? (
          <>
            <h1 className="font-display text-3xl font-bold text-paper sm:text-4xl">{t.title}</h1>
            <p className="text-text-1">{t.body}</p>
            <ConfirmForm email={e!} token={token!} lang={lang} label={t.button} working={t.working} />
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold text-paper sm:text-4xl">{t.invalid_title}</h1>
            <p className="text-text-1">{t.invalid_body}</p>
            <Link href={`/${lang}/subscribe`} className="w-fit rounded-[var(--radius-md)] bg-matrix px-6 py-3 text-sm font-semibold text-bg-0 hover:bg-matrix/90">
              {t.retry}
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
