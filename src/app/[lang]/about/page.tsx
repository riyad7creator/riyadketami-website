import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { localizedAlternates } from '@/lib/seo';
import { Button, Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import MatrixRain from '@/components/ui/MatrixRain';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.about.headline,
    description: dict.about.subheadline,
    alternates: localizedAlternates(lang, 'about'),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.about;

  return (
    <>
      {/* 01 — Hero */}
      <section className="relative pt-32 pb-20 px-5 sm:px-8 overflow-hidden">
        <MatrixRain opacity={0.055} speed={0.6} density={0.55} />
        <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="flex flex-col gap-6 order-2 md:order-1">
            <Reveal direction="up">
              <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h1 className="font-display font-bold tracking-[-0.02em] text-text-0 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05]">
                {t.headline}
              </h1>
            </Reveal>
            <Reveal direction="up" delay={0.16}>
              <p className="text-text-1 text-lg sm:text-xl leading-relaxed max-w-lg">
                {t.subheadline}
              </p>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.1} className="order-1 md:order-2">
            <div className="relative aspect-[4/5] w-full max-w-[440px] mx-auto rounded-[var(--radius-lg)] overflow-hidden border border-border bg-bg-1">
              <Image
                src="/portraits/portrait-hero.png"
                alt="Riyad Ketami"
                fill
                className="object-cover object-top"
                priority
                sizes="(max-width: 768px) 90vw, 440px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-0/70 via-transparent to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 02 — Who I am */}
      <section className="py-28 px-5 sm:px-8 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-5">
            <Reveal direction="up">
              <MatrixText text={t.identity_eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-[-0.01em] text-text-0 leading-[1.1] max-w-3xl">
                {t.identity_title}
              </h2>
            </Reveal>
          </div>
          <div className="flex flex-col gap-6 max-w-3xl">
            {t.identity.map((paragraph, i) => (
              <Reveal key={i} direction="up" delay={0.05 + i * 0.06}>
                <p className="text-text-1 text-xl leading-relaxed">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 03 — What I believe */}
      <section className="py-28 px-5 sm:px-8 border-t border-border bg-bg-1/40">
        <div className="max-w-6xl mx-auto flex flex-col gap-14">
          <div className="flex flex-col gap-4 max-w-2xl">
            <Reveal direction="up">
              <MatrixText text={t.principles_eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-text-0 leading-[1.1]">
                {t.principles_title}
              </h2>
            </Reveal>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
            {t.principles.map((p, i) => (
              <Reveal key={i} direction="up" delay={0.05 + i * 0.05}>
                <div className="flex flex-col gap-2 pl-5 border-l border-matrix/40">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-matrix uppercase">
                    {p.tag}
                  </span>
                  <h3 className="font-display font-semibold text-xl text-text-0 leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-text-2 text-base leading-relaxed">{p.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — What I'm building */}
      <section className="py-28 px-5 sm:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col gap-12">
          <div className="flex flex-col gap-4 max-w-2xl">
            <Reveal direction="up">
              <MatrixText text={t.building_eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-text-0 leading-[1.1]">
                {t.building_title}
              </h2>
            </Reveal>
            <Reveal direction="up" delay={0.16}>
              <p className="text-text-2 text-lg">{t.building_subtitle}</p>
            </Reveal>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {t.building.map((b, i) => (
              <Reveal key={i} direction="up" delay={0.08 + i * 0.08}>
                <article className="h-full p-7 bg-surface border border-border rounded-[var(--radius-lg)] flex flex-col gap-4 transition-colors hover:border-matrix/40">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display font-bold text-2xl text-text-0 tracking-tight">
                      {b.name}
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.2em] text-matrix px-2 py-1 border border-matrix/40 rounded uppercase whitespace-nowrap">
                      {t.building_status}
                    </span>
                  </div>
                  <p className="text-text-2 text-sm leading-relaxed">{b.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 05 — CTA */}
      <section className="py-32 px-5 sm:px-8 bg-bg-1 border-t border-border">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <Reveal direction="up">
            <MatrixText text={t.cta_eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-text-0">
              {t.cta_title}
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.16}>
            <p className="text-text-2 text-lg max-w-xl">{t.cta_body}</p>
          </Reveal>
          <Reveal direction="up" delay={0.24}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <a
                href={`mailto:${t.cta_email}`}
                className="font-mono text-base text-matrix hover:text-matrix-dim transition-colors underline-offset-4 hover:underline"
              >
                {t.cta_email}
              </a>
              <Link href={`/${lang}/contact`}>
                <Button variant="secondary" size="lg">
                  {t.cta_secondary}
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
