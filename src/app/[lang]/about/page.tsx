import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { Button, Reveal } from '@/components/ui';
import { Check } from 'lucide-react';

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
      <section className="pt-32 pb-16 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="flex flex-col gap-6 order-2 md:order-1">
            <Reveal direction="up">
              <span className="font-mono text-xs tracking-[0.2em] text-matrix">{t.eyebrow}</span>
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
              <Link href={`/${lang}/consulting`}>
                <Button variant="primary" size="lg">
                  {t.cta}
                </Button>
              </Link>
            </Reveal>
          </div>

          <Reveal direction="up" delay={0.1} className="order-1 md:order-2">
            <div className="relative aspect-square w-full max-w-[420px] mx-auto rounded-[var(--radius-lg)] overflow-hidden border border-border">
              <Image
                src="/portraits/portrait-hero.png"
                alt="Riyad Ketami"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 90vw, 420px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-0/60 to-transparent" />
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
              <span className="font-mono text-xs tracking-[0.2em] text-matrix">{t.skills_eyebrow}</span>
            </Reveal>
            <Reveal direction="up" delay={0.08}>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
                {t.skills_title}
              </h2>
            </Reveal>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {t.skills.map((skill, i) => (
              <Reveal key={i} direction="up" delay={0.05 + i * 0.05}>
                <div className="flex items-center gap-3 glass rounded-[var(--radius-md)] px-5 py-4 border border-border">
                  <Check size={14} className="text-matrix shrink-0" />
                  <span className="text-text-1 text-sm font-medium">{skill}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-6">
          <Reveal direction="up">
            <span className="font-mono text-xs tracking-[0.2em] text-matrix">
              // available for select engagements
            </span>
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
              {dict.consulting.headline}
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.16}>
            <Link href={`/${lang}/consulting`}>
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
