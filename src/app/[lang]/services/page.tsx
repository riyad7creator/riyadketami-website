import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { localizedAlternates } from '@/lib/seo';
import { BRAND } from '@/lib/brand';
import { getSiteImages } from '@/lib/site-content';
import { Accordion, Button } from '@/components/ui';
import type { AccordionItem } from '@/components/ui';
import Eyebrow from '@/components/ui/Eyebrow';
import { WhatIDoCards } from '@/components/home/WhatIDo';

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
    description: dict.meta.services_description,
    alternates: localizedAlternates(lang, 'services'),
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const img = await getSiteImages();
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
      <section className="px-4 pb-20 pt-32 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12">
          <div className="flex max-w-2xl flex-col gap-4">
            <Eyebrow>{BRAND.eyebrow}</Eyebrow>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-bold leading-[1.05] text-paper">
              {t.headline}
            </h1>
            <p className="text-xl leading-relaxed text-text-1">{t.subheadline}</p>
          </div>
          <WhatIDoCards dict={dict} headingLevel="h2" />
        </div>
      </section>

      {/* A08 — downloadable speaker card for organisers (brief §6.1) */}
      <section aria-labelledby="speaker" className="border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-[1fr_280px]">
          <div className="flex max-w-xl flex-col gap-4">
            <Eyebrow>{t.speaker.eyebrow}</Eyebrow>
            <h2 id="speaker" className="font-display text-3xl font-bold text-paper">
              {t.speaker.title}
            </h2>
            <p className="text-lg leading-relaxed text-text-1">{t.speaker.body}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={BRAND.images.speakerCard}
                download
                className="inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] border border-line px-5 text-sm text-paper hover:border-paper/60"
              >
                {t.speaker.cta}
              </a>
              <Button href={BRAND.speakMailto} variant="primary">
                {t.cta_button_alt}
              </Button>
            </div>
          </div>
          <div className="relative mx-auto aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-[var(--radius-md)] border border-line">
            <Image
              src={BRAND.images.speakerCard}
              alt="Riyad Ketami speaker card: AI Expert, Co-founder, Algeria Business Bay"
              fill
              sizes="280px"
              loading="lazy"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="process" className="border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Eyebrow>{t.process_eyebrow}</Eyebrow>
            <h2 id="process" className="font-display text-3xl font-bold text-paper sm:text-4xl">
              {t.process_title}
            </h2>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3">
            {t.process.map((step) => (
              <li key={step.step} className="flex flex-col gap-3 border-t border-line pt-5">
                <span className="font-mono text-xs tracking-[0.12em] text-signal">{step.step}</span>
                <h3 className="font-display text-xl font-bold text-paper">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-1">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="faq" className="border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Eyebrow>{t.faq_eyebrow}</Eyebrow>
            <h2 id="faq" className="font-display text-3xl font-bold text-paper sm:text-4xl">
              {t.faq_title}
            </h2>
          </div>
          <div className="max-w-3xl">
            <Accordion items={faqItems} />
          </div>
        </div>
      </section>

      <section aria-labelledby="services-cta" className="border-t border-line px-4 py-20 sm:px-8">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-6">
          <Eyebrow>{t.cta_eyebrow}</Eyebrow>
          <h2 id="services-cta" className="font-display text-3xl font-bold text-paper sm:text-4xl">
            {t.cta_title}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button href={BRAND.mailto} variant="primary" size="lg">
              {t.cta_button}
            </Button>
            <Button href={BRAND.speakMailto} variant="secondary" size="lg">
              {t.cta_button_alt}
            </Button>
          </div>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-md)] border border-line">
            <Image src={img.readyToStart.src} alt={img.readyToStart.alt} fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
