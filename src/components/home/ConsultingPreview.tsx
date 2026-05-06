import { Check } from 'lucide-react';
import { ArrowLink, Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';

type TierKey = 'signal' | 'sprint' | 'stack';

interface ConsultingPreviewProps {
  locale: Locale;
  dict: Dictionary;
}

export default function ConsultingPreview({ locale, dict }: ConsultingPreviewProps) {
  const t = dict.home.consulting_teaser;
  const tiers = dict.consulting.tiers;

  const items: Array<{ key: TierKey; featured: boolean; tier: typeof tiers.signal }> = [
    { key: 'signal', featured: false, tier: tiers.signal },
    { key: 'sprint', featured: true, tier: tiers.sprint },
    { key: 'stack', featured: false, tier: tiers.stack },
  ];

  return (
    <section className="py-24 sm:py-32 px-5 sm:px-8 bg-bg-1/40 border-y border-border">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-3 max-w-2xl">
          <Reveal direction="up">
            <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 className="font-display font-bold tracking-tight text-text-0 text-3xl sm:text-4xl md:text-5xl leading-[1.1]">
              {t.title}
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.16}>
            <p className="text-text-1 text-lg leading-relaxed">{t.subtitle}</p>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {items.map(({ key, featured, tier }, i) => (
            <Reveal key={key} direction="up" delay={0.1 + i * 0.08}>
              <div
                className={`flex flex-col gap-5 rounded-[var(--radius-lg)] p-6 h-full border ${
                  featured ? 'bg-matrix/5 border-matrix/30' : 'glass border-border'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display font-semibold text-text-0">{tier.name}</span>
                  <span className="font-display font-bold text-2xl text-text-0">{tier.price}</span>
                </div>
                <p className="text-text-2 text-sm leading-relaxed">{tier.description}</p>
                <ul className="flex flex-col gap-2 mt-auto pt-3 border-t border-border">
                  {tier.highlights.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-text-1">
                      <Check size={12} className="text-matrix shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal direction="up">
          <ArrowLink href={`/${locale}/consulting`}>{t.cta}</ArrowLink>
        </Reveal>
      </div>
    </section>
  );
}
