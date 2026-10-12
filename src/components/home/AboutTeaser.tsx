import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import { BRAND } from '@/lib/brand';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';

interface AboutTeaserProps {
  locale: Locale;
  dict: Dictionary;
}

/** Brief §2.3 About, verbatim, ending on the master tagline. */
export default function AboutTeaser({ locale, dict }: AboutTeaserProps) {
  const t = dict.home.about;
  return (
    <section aria-labelledby="about" className="border-t border-line px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-[1fr_2fr]">
        <Eyebrow as="h2" id="about">
          {t.eyebrow}
        </Eyebrow>
        <div className="flex max-w-2xl flex-col gap-5">
          {t.paragraphs.map((p) => (
            <p key={p} className="text-lg leading-relaxed text-text-1">
              {p}
            </p>
          ))}
          <p className="font-display text-2xl font-bold text-paper">{BRAND.tagline}</p>
          <Link
            href={`/${locale}/about`}
            className="inline-flex min-h-[44px] w-fit items-center font-mono text-xs tracking-[0.08em] text-paper underline decoration-signal underline-offset-[6px] hover:text-signal"
          >
            {t.cta} <span aria-hidden className="ms-1 rtl-flip inline-block">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
