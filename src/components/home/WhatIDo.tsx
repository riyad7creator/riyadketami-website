import Eyebrow from '@/components/ui/Eyebrow';
import Flag from '@/components/ui/Flag';
import Image from 'next/image';
import { withArabic } from '@/components/ui/Ar';
import { BRAND } from '@/lib/brand';
import { getSiteImages } from '@/lib/site-content';
import type { Dictionary } from '@/lib/dictionaries';


const LINKS: Array<{ href: string | null; external: boolean; missing?: string }> = [
  { href: BRAND.youtubeUrl, external: true },
  { href: BRAND.mediaKitUrl, external: true, missing: 'media kit URL' },
  { href: BRAND.speakMailto, external: false },
];

interface WhatIDoProps {
  dict: Dictionary;
  /** Page-level h1 already says "What I do" on /services */
  headingLevel?: 'h2' | 'h3';
}

export async function WhatIDoCards({ dict, headingLevel = 'h3' }: WhatIDoProps) {
  const img = await getSiteImages();
  const VISUALS = [img.cardDarija, img.cardLaunch, img.cardTalks] as const;
  const cards = dict.home.what_i_do.cards;
  const H = headingLevel;
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {cards.map((card, i) => {
        const link = LINKS[i]!;
        const visual = VISUALS[i]!;
        return (
          <li key={card.title} className="flex flex-col gap-5 rounded-[var(--radius-md)] border border-line bg-panel p-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sm)]">
              <Image
                src={visual.src}
                alt={visual.alt}
                fill
                sizes="(min-width: 768px) 360px, 100vw"
                className="object-cover"
              />
            </div>
            <Eyebrow>{withArabic(card.eyebrow)}</Eyebrow>
            <H className="font-display text-xl font-bold text-paper">{card.title}</H>
            <p className="flex-1 text-sm leading-relaxed text-text-1">{card.body}</p>
            {link.href ? (
              <a
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener' } : {})}
                className="inline-flex min-h-[44px] items-center font-mono text-xs tracking-[0.08em] text-paper underline decoration-signal decoration-1 underline-offset-[6px] hover:text-signal"
              >
                {card.link}
              </a>
            ) : process.env.NODE_ENV === 'production' ? null : (
              <span className="inline-flex min-h-[44px] flex-wrap items-center gap-2 font-mono text-xs text-muted">
                {card.link} <Flag kind="MISSING">{link.missing}</Flag>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function WhatIDo({ dict }: { dict: Dictionary }) {
  return (
    <section aria-labelledby="what-i-do" className="px-4 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
        <Eyebrow as="h2" id="what-i-do">
          {dict.home.what_i_do.eyebrow}
        </Eyebrow>
        <WhatIDoCards dict={dict} />
      </div>
    </section>
  );
}
