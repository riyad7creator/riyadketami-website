import { getImageProps } from 'next/image';
import { Button } from '@/components/ui';
import Eyebrow from '@/components/ui/Eyebrow';
import Ar from '@/components/ui/Ar';
import { BRAND } from '@/lib/brand';
import { getSiteImages } from '@/lib/site-content';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';

interface HeroProps {
  locale: Locale;
  dict: Dictionary;
}

export default async function Hero({ locale, dict }: HeroProps) {
  const t = dict.home.hero;
  const site = await getSiteImages();
  // One <img> serves both art directions, so it carries one alt: the desktop
  // slot's (the larger, default crop), falling back to the mobile one if empty.
  const HERO_ALT = site.heroDesktop.alt || site.heroMobile.alt;

  // Art direction: V08 (subject right, text left) on desktop, V01 (3:4) on mobile.
  const common = { alt: HERO_ALT, sizes: '100vw', fetchPriority: 'high' as const, loading: 'eager' as const };
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...common, src: site.heroDesktop.src, width: site.heroDesktop.width, height: site.heroDesktop.height });
  const {
    props: { srcSet: mobileSrcSet, ...img },
  } = getImageProps({ ...common, src: site.heroMobile.src, width: site.heroMobile.width, height: site.heroMobile.height });

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-ink md:block md:min-h-[100svh]">
      <div className="order-1 mx-auto flex w-full max-w-[1200px] flex-col px-4 pb-10 pt-28 sm:px-8 md:min-h-[100svh] md:justify-center md:pb-16 md:pt-24">
        {/* RTL keeps the copy on the left: A05's subject sits right, and mirroring
            the photo would alter the likeness. */}
        <div className="flex max-w-[34rem] flex-col gap-6 md:rtl:ms-auto">
          <Eyebrow as="p" className="text-[11px] sm:text-xs">
            {BRAND.eyebrow}
          </Eyebrow>

          <h1 className="font-display text-[clamp(2.25rem,6vw,4.25rem)] font-bold leading-[1.04] text-paper">
            {t.headline}
          </h1>

          {locale !== 'ar' && (
            <Ar as="p" className="w-fit text-xl text-paper sm:text-2xl">
              {BRAND.heroArabic}
            </Ar>
          )}

          <p className="max-w-[30rem] text-base leading-relaxed text-text-1 sm:text-lg">{t.subheadline}</p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button href={BRAND.mailto} variant="primary" size="lg">
              {t.cta_work}
            </Button>
            <Button href={BRAND.abb.url} target="_blank" rel="noopener" variant="secondary" size="lg">
              {t.cta_abb}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile: portrait below the copy, in flow. Desktop: full-bleed background, subject right.
          [VISUAL V07] (optional loop) would use V08 as its poster. */}
      <div
        data-visual="V08 V01"
        className="relative order-2 aspect-[3/4] w-full md:absolute md:inset-0 md:-z-10 md:aspect-auto"
      >
        <picture>
          <source media="(min-width: 768px)" srcSet={desktopSrcSet} />
          <source srcSet={mobileSrcSet} />
          <img
            {...img}
            alt={HERO_ALT}
            className="absolute inset-0 h-full w-full object-cover object-bottom md:object-right"
          />
        </picture>
        {/* Darken behind the copy until text contrast clears 4.5:1 (brief §6.4) */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-ink to-transparent to-30% md:bg-gradient-to-r md:from-ink md:via-ink/85 md:via-40% md:to-transparent md:to-100%"
        />
      </div>
    </section>
  );
}
