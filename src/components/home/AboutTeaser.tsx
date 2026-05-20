import Image from 'next/image';
import { ArrowLink, Reveal, ParallaxLayer } from '@/components/ui';
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
    <section className="relative py-24 sm:py-32 px-5 sm:px-8 overflow-hidden">
      {/* Background portrait layer */}
      <ParallaxLayer speed={0.15} className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <Image
            src="/images/matrix-bg-about.png"
            alt=""
            fill
            className="object-cover object-center grayscale opacity-[0.10]"
            sizes="100vw"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg-0/80 via-bg-0/40 to-bg-0/80" />
        </div>
      </ParallaxLayer>
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col gap-6">
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
