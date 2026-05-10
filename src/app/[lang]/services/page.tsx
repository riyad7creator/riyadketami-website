import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { Accordion, Button, Reveal } from '@/components/ui';
import type { AccordionItem } from '@/components/ui';
import { Check } from 'lucide-react';
import MatrixText from '@/components/ui/MatrixText';
import TestimonialsSection from '@/components/home/TestimonialsSection';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.services.headline,
    description: dict.services.subheadline,
  };
}

const SERVICE_ACCENT = [
  'border-matrix/20 hover:border-matrix/40',
  'bg-matrix/5 border-matrix/40 shadow-[0_0_60px_rgba(0,255,102,0.06)]',
  'border-matrix/20 hover:border-matrix/40',
] as const;

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.services;

  const faqItems: AccordionItem[] = t.faq.map((item, i) => ({
    id: String(i),
    question: item.q,
    answer: item.a,
  }));

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          <Reveal direction="up">
            <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h1 className="font-display font-bold text-[clamp(2.5rem,6vw,4rem)] tracking-[-0.02em] text-text-0 leading-[1.05]">
              {t.headline}
            </h1>
          </Reveal>
          <Reveal direction="up" delay={0.16}>
            <p className="text-text-1 text-xl leading-relaxed">{t.subheadline}</p>
          </Reveal>
        </div>
      </section>

      {/* Service cards */}
      <section className="pb-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-5">
          {t.items.map((item, i) => (
            <Reveal key={i} direction="up" delay={0.05 + i * 0.1}>
              <div
                className={`flex flex-col gap-6 h-full rounded-[var(--radius-lg)] p-8 border transition-colors duration-[var(--duration-fast)] ${SERVICE_ACCENT[i]}`}
              >
                {/* Tag */}
                <span className="font-mono text-[10px] tracking-[0.15em] text-matrix border border-matrix/30 rounded-full px-2.5 py-1 w-fit">
                  {item.tag}
                </span>

                <div className="flex flex-col gap-2">
                  <h2 className="font-display font-bold text-2xl text-text-0 leading-tight">
                    {item.name}
                  </h2>
                  <p className="text-text-2 text-sm leading-relaxed">{item.description}</p>
                </div>

                <ul className="flex flex-col gap-2.5 flex-1">
                  {item.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-text-1">
                      <Check size={13} className="text-matrix shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-2 pt-2">
                  <Link href={`/${lang}/contact`}>
                    <Button variant={i === 1 ? 'primary' : 'secondary'} className="w-full">
                      {item.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="py-24 px-5 sm:px-8 border-t border-border bg-bg-1/40">
        <div className="max-w-6xl mx-auto flex flex-col gap-14">
          <div className="flex flex-col gap-3">
            <Reveal direction="up">
              <MatrixText text={t.process_eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
                {t.process_title}
              </h2>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {t.process.map((step, i) => (
              <Reveal key={i} direction="up" delay={0.08 + i * 0.1}>
                <div className="flex flex-col gap-4">
                  <span className="font-mono text-[2.5rem] font-bold text-matrix/20 leading-none">
                    {step.step}
                  </span>
                  <h3 className="font-display font-semibold text-xl text-text-0">{step.title}</h3>
                  <p className="text-text-2 text-sm leading-relaxed">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection dict={dict} />

      {/* FAQ */}
      <section className="py-24 px-5 sm:px-8 border-t border-border">
        <div className="max-w-3xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Reveal direction="up">
              <MatrixText text={t.faq_eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
                {t.faq_title}
              </h2>
            </Reveal>
          </div>
          <Reveal direction="up" delay={0.12}>
            <Accordion items={faqItems} />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 sm:px-8 border-t border-border">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <Reveal direction="up">
            <MatrixText text={t.cta_eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
              {t.cta_title}
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.16}>
            <p className="text-text-1 text-lg">{t.cta_body}</p>
          </Reveal>
          <Reveal direction="up" delay={0.24}>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={`/${lang}/contact`}>
                <Button variant="primary" size="lg">{t.cta_button}</Button>
              </Link>
              <Link href={`/${lang}/contact`}>
                <Button variant="secondary" size="lg">{t.cta_button_alt}</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
