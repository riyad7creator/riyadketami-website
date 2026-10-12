import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { localizedAlternates } from '@/lib/seo';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui';
import Eyebrow from '@/components/ui/Eyebrow';
import VisualPlaceholder from '@/components/ui/VisualPlaceholder';
import SocialRow from '@/components/ui/SocialRow';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.about.eyebrow,
    description: dict.meta.about_description,
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
  const copy = dict.home.about;

  return (
    <>
      <section className="px-4 pb-16 pt-32 sm:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="flex flex-col gap-5">
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h1 className="font-display text-[clamp(2.5rem,6vw,4.25rem)] font-bold leading-[1.04] text-paper">
              {BRAND.name}
            </h1>
            {/* Brief §1: proof line always directly under the title */}
            <p className="font-mono text-sm uppercase tracking-[0.12em] text-paper">
              {BRAND.title}
              <span className="text-muted"> · </span>
              {BRAND.proofLine}
            </p>
            <p className="text-muted">{dict.home.contact.location}</p>
            <div className="flex items-center gap-4 pt-2">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-line">
                <Image src={BRAND.images.avatar} alt="Riyad Ketami, portrait" fill sizes="64px" className="object-cover" />
              </div>
              <SocialRow className="-ms-2" />
            </div>
          </div>

          {/* V05 — About: OFFLINE / Oran daytime portrait (brief §6.2) */}
          <VisualPlaceholder id="V05" alt="Riyad on the Oran seafront" label="Riyad on the Oran seafront" ratio="3 / 2" />
        </div>
      </section>

      <section className="border-t border-line px-4 py-16 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
          <div className="flex max-w-2xl flex-col gap-5">
            {copy.paragraphs.map((p) => (
              <p key={p} className="text-lg leading-relaxed text-text-1">
                {p}
              </p>
            ))}
            <p className="font-display text-2xl font-bold text-paper">{BRAND.tagline}</p>
          </div>

          {/* Manifesto: About section only, never the headline (brief §1) */}
          <figure className="mt-8 flex max-w-2xl flex-col gap-3 border-s border-signal ps-5">
            <Eyebrow as="figcaption">{t.manifesto_label}</Eyebrow>
            <blockquote className="font-display text-xl italic text-paper" lang="en">
              {BRAND.manifesto}
            </blockquote>
          </figure>

          <div className="flex flex-wrap gap-3 pt-8">
            <Button href={BRAND.mailto} variant="primary" size="lg">
              {t.cta}
            </Button>
            <Button href={`/${lang}/contact`} variant="secondary" size="lg">
              {t.cta_secondary}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
