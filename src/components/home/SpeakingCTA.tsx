import Link from 'next/link';
import { Button, Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';

interface SpeakingCTAProps {
  locale: Locale;
  dict: Dictionary;
}

export default function SpeakingCTA({ locale, dict }: SpeakingCTAProps) {
  const t = dict.home.speaking;

  const stats = [
    { value: t.stat_events, label: t.stat_events_label },
    { value: t.stat_continents, label: t.stat_continents_label },
    { value: t.stat_reach, label: t.stat_reach_label },
  ];

  return (
    <section className="py-16 sm:py-24 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto">
        <Reveal direction="up">
          <div className="relative rounded-[var(--radius-xl)] border border-matrix/20 bg-matrix/[0.03] shadow-[0_0_80px_rgba(0,255,102,0.05)] p-10 sm:p-16 flex flex-col items-center text-center gap-8 overflow-hidden">
            {/* subtle corner glows */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-matrix/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-matrix/10 rounded-full blur-3xl pointer-events-none" />

            <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix relative z-10" />

            <h2 className="font-display font-bold text-[clamp(1.75rem,5vw,3.5rem)] tracking-[-0.02em] text-text-0 leading-[1.05] relative z-10">
              {t.title}
            </h2>

            <p className="text-text-1 text-lg leading-relaxed max-w-lg relative z-10">
              {t.subtitle}
            </p>

            <div className="grid grid-cols-3 gap-6 w-full max-w-sm border-y border-border/50 py-6 relative z-10">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <span className="font-display font-bold text-2xl sm:text-3xl text-matrix">{s.value}</span>
                  <span className="font-mono text-[10px] tracking-[0.1em] text-text-2 uppercase">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3 relative z-10">
              <Link href={`/${locale}/contact`}>
                <Button variant="primary" size="lg">{t.cta_primary}</Button>
              </Link>
              <Link href={`/${locale}/consulting`}>
                <Button variant="secondary" size="lg">{t.cta_secondary}</Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
