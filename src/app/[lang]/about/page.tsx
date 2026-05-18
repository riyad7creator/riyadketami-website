import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { Button, Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import MatrixRain from '@/components/ui/MatrixRain';
import SkillsGrid from '@/components/about/SkillsGrid';

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
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-5 sm:px-8 overflow-hidden">
        <MatrixRain opacity={0.055} speed={0.6} density={0.55} />
        <div className="relative z-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="flex flex-col gap-6 order-2 md:order-1">
            <Reveal direction="up">
              <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h1 className="font-display font-bold tracking-[-0.02em] text-text-0 text-[clamp(2rem,5vw,3.5rem)] leading-[1.1]">
                {t.headline}
              </h1>
            </Reveal>
            <Reveal direction="up" delay={0.16}>
              <p className="text-text-1 text-lg leading-relaxed max-w-md">{t.subheadline}</p>
            </Reveal>
            <Reveal direction="up" delay={0.24}>
              <Link href={`/${lang}/services`}>
                <Button variant="primary" size="lg">
                  {t.cta}
                </Button>
              </Link>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.1} className="order-1 md:order-2">
            <div className="relative aspect-[4/3] w-full max-w-[480px] mx-auto rounded-[var(--radius-lg)] overflow-hidden border border-border">
              {/* Full-bleed consulting visual background */}
              <Image
                src="/images/consulting-visual.png"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 90vw, 480px"
                aria-hidden
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/60" />
              {/* Portrait inset — bottom-left corner */}
              <div className="absolute bottom-5 left-5 w-24 h-24 rounded-full border-2 border-matrix/60 overflow-hidden shadow-[0_0_24px_rgba(0,255,102,0.25)]">
                <Image
                  src="/portraits/portrait-hero.png"
                  alt="Riyad Ketami"
                  fill
                  className="object-cover object-top"
                  priority
                  sizes="96px"
                />
              </div>
              {/* Gradient vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-0/50 to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Bio */}
      <section className="py-16 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {t.bio.map((paragraph, i) => (
            <Reveal key={i} direction="up" delay={i * 0.08}>
              <p className="text-text-1 text-lg leading-relaxed">{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="py-16 px-5 sm:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Reveal direction="up">
              <MatrixText text={t.skills_eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
                {t.skills_title}
              </h2>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.05}>
            <SkillsGrid skills={t.skills} />
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <Reveal direction="up">
            <MatrixText text="// available for select engagements" className="text-xs tracking-[0.2em] text-matrix" />
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
              {dict.services.cta_title}
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.16}>
            <Link href={`/${lang}/services`}>
              <Button variant="primary" size="lg">
                {t.cta}
              </Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
