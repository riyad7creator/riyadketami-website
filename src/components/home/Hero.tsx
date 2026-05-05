import Link from 'next/link';
import HeroCanvas from './HeroCanvas';
import { Button, Reveal } from '@/components/ui';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';

interface HeroProps {
  locale: Locale;
  dict: Dictionary;
}

export default function Hero({ locale, dict }: HeroProps) {
  const t = dict.home;

  return (
    <section className="relative min-h-[100dvh] flex items-center pt-24 pb-12 px-5 sm:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div className="flex flex-col gap-7 order-2 md:order-1">
          <Reveal direction="up">
            <span className="font-mono text-xs sm:text-sm tracking-[0.2em] text-matrix">
              {t.eyebrow}
            </span>
          </Reveal>

          <Reveal direction="up" delay={0.08}>
            <h1 className="font-display font-bold tracking-[-0.02em] text-text-0 leading-[1.05] text-[clamp(2.5rem,7vw,5rem)]">
              {t.headline}
            </h1>
          </Reveal>

          <Reveal direction="up" delay={0.16}>
            <p className="text-text-1 text-lg sm:text-xl leading-relaxed max-w-md">
              {t.subheadline}
            </p>
          </Reveal>

          <Reveal direction="up" delay={0.24}>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/${locale}/consulting`}>
                <Button variant="primary" size="lg" magnetic>
                  {t.cta_consulting}
                </Button>
              </Link>
              <Link href={`/${locale}/blog`}>
                <Button variant="secondary" size="lg">
                  {t.cta_blog}
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>

        <div className="order-1 md:order-2 relative aspect-square w-full max-w-[480px] mx-auto">
          <HeroCanvas src="/portraits/portrait-hero.png" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-0 to-transparent pointer-events-none" />
    </section>
  );
}
