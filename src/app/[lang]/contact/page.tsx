import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import MatrixRain from '@/components/ui/MatrixRain';
import ContactForm from '@/components/contact/ContactForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.contact.headline };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.contact;

  const formLabels = {
    name: t.fields.name,
    email: t.fields.email,
    subject: t.fields.subject,
    message: t.fields.message,
    budget: t.fields.budget,
    submit: t.submit,
    success: t.success,
    error: t.error,
  };

  return (
    <section className="relative pt-32 pb-24 px-5 sm:px-8 overflow-hidden">
      <MatrixRain opacity={0.08} />
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Reveal direction="up">
            <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h1 className="font-display font-bold text-[clamp(2.5rem,6vw,4rem)] tracking-[-0.02em] text-text-0 leading-[1.05]">
              {t.headline}
            </h1>
          </Reveal>
        </div>

        <Reveal direction="up" delay={0.16}>
          <ContactForm labels={formLabels} />
        </Reveal>

        {/* Direct email */}
        <Reveal direction="up" delay={0.24}>
          <div className="pt-8 border-t border-white/[0.06] text-center flex flex-col items-center gap-3">
            <MatrixText
              text={t.email_eyebrow}
              className="text-xs tracking-[0.2em] text-matrix"
            />
            <a
              href="mailto:riyad@ketami.net"
              className="inline-flex items-center gap-2 text-matrix font-mono text-sm hover:opacity-80 transition-opacity duration-[var(--duration-fast)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              {t.email_address}
            </a>
            <p className="text-xs text-text-2 font-mono">{t.email_response}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
