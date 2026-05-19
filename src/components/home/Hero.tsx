import Link from 'next/link';
import HeroPortrait from './HeroPortrait';
import { Button, Reveal, MatrixRain } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';
import type { SocialEntry } from '@/lib/home-data';

interface HeroProps {
  locale: Locale;
  dict: Dictionary;
  socials?: SocialEntry[];
}

const PLATFORM_ABBR: Record<string, string> = {
  tiktok: 'TK',
  instagram: 'IG',
  facebook: 'FB',
  youtube: 'YT',
  x: 'X',
  linkedin: 'LI',
  github: 'GH',
};

export default function Hero({ locale, dict, socials = [] }: HeroProps) {
  const t = dict.home;
  const socialLinks = socials.filter((s) => PLATFORM_ABBR[s.platform]);

  return (
    <section className="relative min-h-[100dvh] flex items-center pt-24 pb-12 px-5 sm:px-8 overflow-hidden">
      <MatrixRain opacity={0.055} speed={0.6} density={0.55} />

      <div className="relative z-10 max-w-6xl mx-auto w-full grid-phi items-center">
        <div className="flex flex-col gap-7 order-2 md:order-1">
          <Reveal direction="up">
            <MatrixText
              text={t.eyebrow}
              className="text-xs sm:text-sm tracking-[0.2em] text-matrix"
            />
          </Reveal>

          <Reveal direction="up" delay={0.08}>
            <h1 className="font-display font-bold tracking-[-0.02em] text-text-0 leading-[1.05] text-[clamp(2.5rem,7vw,5rem)]">
              {t.headline}
            </h1>
          </Reveal>

          <Reveal direction="up" delay={0.16}>
            <p className="text-text-1 text-lg sm:text-xl leading-phi measure">
              {t.subheadline}
            </p>
          </Reveal>

          <Reveal direction="up" delay={0.24}>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/${locale}/services`}>
                <Button variant="primary" size="lg">
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

          {socialLinks.length > 0 && (
            <Reveal direction="up" delay={0.32}>
              <div className="flex items-center gap-4 pt-1">
                {socialLinks.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.platform}
                    className="font-mono text-[10px] tracking-[0.18em] text-text-2 hover:text-matrix transition-colors duration-[var(--duration-fast)]"
                  >
                    {PLATFORM_ABBR[s.platform]}
                  </a>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        <div className="order-1 md:order-2 relative aspect-[3/4] md:aspect-square w-full max-w-[480px] mx-auto">
          <HeroPortrait src="/portraits/portrait-hero.png" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-0 to-transparent pointer-events-none z-10" />
    </section>
  );
}
