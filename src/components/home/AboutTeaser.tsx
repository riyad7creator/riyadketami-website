import { ArrowLink, Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';

interface AboutTeaserProps {
  locale: Locale;
  dict: Dictionary;
}

export default function AboutTeaser({ locale, dict }: AboutTeaserProps) {
  const t = dict.home.about_teaser;

  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <Reveal direction="up">
          <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
        </Reveal>

        <Reveal direction="up" delay={0.08}>
          <h2 className="font-display font-bold tracking-tight text-text-0 text-3xl sm:text-4xl md:text-5xl leading-[1.1]">
            {t.title}
          </h2>
        </Reveal>

        <Reveal direction="up" delay={0.16}>
          <p className="text-text-1 text-lg leading-relaxed">{t.body}</p>
        </Reveal>

        <Reveal direction="up" delay={0.24}>
          <ArrowLink href={`/${locale}/about`} className="mt-2">
            {t.cta}
          </ArrowLink>
        </Reveal>
      </div>
    </section>
  );
}
