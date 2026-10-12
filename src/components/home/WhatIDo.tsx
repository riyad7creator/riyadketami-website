import Eyebrow from '@/components/ui/Eyebrow';
import Flag from '@/components/ui/Flag';
import VisualPlaceholder from '@/components/ui/VisualPlaceholder';
import { withArabic } from '@/components/ui/Ar';
import { BRAND } from '@/lib/brand';
import type { Dictionary } from '@/lib/dictionaries';

// Brief §6.2 manifest: slot → visual ID + final alt text
const VISUALS = [
  { id: 'V02', alt: 'Riyad recording an AI breakdown at his desk' },
  { id: 'V03', alt: 'Riyad filming a vertical video with a phone rig' },
  { id: 'V04', alt: 'Riyad speaking on stage' },
] as const;

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

export function WhatIDoCards({ dict, headingLevel = 'h3' }: WhatIDoProps) {
  const cards = dict.home.what_i_do.cards;
  const H = headingLevel;
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {cards.map((card, i) => {
        const link = LINKS[i]!;
        const visual = VISUALS[i]!;
        return (
          <li key={card.title} className="flex flex-col gap-5 rounded-[var(--radius-md)] border border-line bg-panel p-5">
            <VisualPlaceholder id={visual.id} alt={visual.alt} label={visual.alt} ratio="4 / 3" />
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
            ) : (
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
