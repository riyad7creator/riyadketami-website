'use client';

import { Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import MatrixRain from '@/components/ui/MatrixRain';
import NewsletterForm from '@/components/newsletter/NewsletterForm';
import type { Dictionary } from '@/lib/dictionaries';
import type { Locale } from '@/i18n/config';

interface NewsletterSectionProps {
  dict: Dictionary;
  locale: Locale;
}

export default function NewsletterSection({ dict, locale }: NewsletterSectionProps) {
  const t = dict.home.newsletter;

  return (
    <section
      id="newsletter"
      className="relative py-20 sm:py-28 px-5 sm:px-8 bg-bg-1/40 border-y border-border overflow-hidden"
    >
      <MatrixRain opacity={0.05} />
      <div className="relative z-10 max-w-xl mx-auto text-center flex flex-col items-center gap-6">
        <Reveal direction="up">
          <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
        </Reveal>

        <Reveal direction="up" delay={0.08}>
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
            {t.title}
          </h2>
        </Reveal>

        <Reveal direction="up" delay={0.16}>
          <p className="text-text-1 text-base sm:text-lg leading-relaxed">{t.subtitle}</p>
        </Reveal>

        <Reveal direction="up" delay={0.24} className="w-full">
          <NewsletterForm dict={dict} locale={locale} variant="inline" />
        </Reveal>
      </div>
    </section>
  );
}
