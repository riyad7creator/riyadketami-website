import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { Accordion, Button, Reveal } from '@/components/ui';
import type { AccordionItem } from '@/components/ui';
import { Check } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.consulting.headline,
    description: dict.consulting.subheadline,
  };
}

type TierKey = 'signal' | 'sprint' | 'stack';
const TIER_KEYS: TierKey[] = ['signal', 'sprint', 'stack'];

export default async function ConsultingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.consulting;

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
            <span className="font-mono text-xs tracking-[0.2em] text-matrix">{t.eyebrow}</span>
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

      {/* Tiers */}
      <section className="pb-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-5">
          {TIER_KEYS.map((key, i) => {
            const tier = t.tiers[key];
            const featured = key === 'sprint';
            return (
              <Reveal key={key} direction="up" delay={0.05 + i * 0.08}>
                <div
                  className={`flex flex-col gap-6 h-full rounded-[var(--radius-lg)] p-7 border ${
                    featured
                      ? 'bg-matrix/5 border-matrix/40 shadow-[0_0_40px_rgba(0,255,102,0.08)]'
                      : 'glass border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-display font-semibold text-text-0 text-lg">{tier.name}</span>
                    {featured && (
                      <span className="font-mono text-[10px] tracking-widest text-matrix border border-matrix/40 rounded-full px-2.5 py-0.5">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="font-display font-bold text-4xl text-text-0">{tier.price}</span>
                  </div>

                  <p className="text-text-2 text-sm leading-relaxed">{tier.description}</p>

                  <ul className="flex flex-col gap-3 flex-1">
                    {tier.highlights.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-text-1">
                        <Check size={13} className="text-matrix shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={`/${lang}/contact`} className="mt-auto">
                    <Button variant={featured ? 'primary' : 'secondary'} className="w-full" magnetic={featured}>
                      {t.tier_cta}
                    </Button>
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Process */}
      <section className="py-24 px-5 sm:px-8 border-t border-border bg-bg-1/40">
        <div className="max-w-6xl mx-auto flex flex-col gap-14">
          <div className="flex flex-col gap-3">
            <Reveal direction="up">
              <span className="font-mono text-xs tracking-[0.2em] text-matrix">{t.process_eyebrow}</span>
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
                {t.process_title}
              </h2>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {t.process.map((step, i) => (
              <Reveal key={i} direction="up" delay={0.08 + i * 0.08}>
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

      {/* FAQ */}
      <section className="py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Reveal direction="up">
              <span className="font-mono text-xs tracking-[0.2em] text-matrix">{t.faq_eyebrow}</span>
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
            <span className="font-mono text-xs tracking-[0.2em] text-matrix">{t.cta_eyebrow}</span>
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
            <Link href={`/${lang}/contact`}>
              <Button variant="primary" size="lg" magnetic>
                {t.cta_button}
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
