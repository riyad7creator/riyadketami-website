import Link from 'next/link';
import Image from 'next/image';
import { ArrowLink, Reveal, ParallaxLayer } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';

interface ServicesSectionProps {
  locale: Locale;
  dict: Dictionary;
}

const SERVICE_ICONS = ['◈', '◉', '◧'] as const;

export default function ServicesSection({ locale, dict }: ServicesSectionProps) {
  const t = dict.home.services;
  const items = dict.services.items;

  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8 bg-bg-1/40 border-y border-border overflow-hidden">
      {/* Parallax background image */}
      <ParallaxLayer speed={0.18} className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <Image
            src="/images/section-consulting.png"
            alt=""
            fill
            className="object-cover opacity-[0.06]"
            sizes="100vw"
            aria-hidden
          />
        </div>
      </ParallaxLayer>
      <div className="relative z-10 max-w-6xl mx-auto flex flex-col gap-12">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-xl">
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
          <Reveal direction="up" delay={0.2}>
            <ArrowLink href={`/${locale}/services`}>{t.cta}</ArrowLink>
          </Reveal>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <Reveal key={i} direction="up" delay={0.08 + i * 0.1}>
              <div className="group flex flex-col gap-5 h-full glass rounded-[var(--radius-lg)] p-7 hover:border-matrix/30 transition-colors duration-[var(--duration-fast)]">
                {/* Tag */}
                <span className="font-mono text-[10px] tracking-[0.15em] text-matrix border border-matrix/30 rounded-full px-2.5 py-1 w-fit">
                  {item.tag}
                </span>

                {/* Icon + name */}
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-3xl text-matrix/30 leading-none select-none" aria-hidden>
                    {SERVICE_ICONS[i]}
                  </span>
                  <h3 className="font-display font-semibold text-lg text-text-0 group-hover:text-matrix transition-colors duration-[var(--duration-fast)]">
                    {item.name}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-text-2 text-sm leading-relaxed flex-1">{item.description}</p>

                {/* CTA */}
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.12em] text-matrix hover:gap-3 transition-all duration-[var(--duration-fast)]"
                >
                  {item.cta} →
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
