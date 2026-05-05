import { Marquee } from '@/components/ui';
import type { SocialPlatform } from '@/models/SocialAccount';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';
import type { SocialEntry } from '@/lib/home-data';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  x: 'X',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  other: 'Web',
};

const LOCALE_TAG: Record<Locale, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  ar: 'ar-MA',
};

function formatFollowers(n: number, lang: Locale): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v.toFixed(v >= 10 ? 0 : 1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v.toFixed(v >= 10 ? 0 : 1).replace(/\.0$/, '')}K`;
  }
  return n.toLocaleString(LOCALE_TAG[lang]);
}

interface FollowerStripProps {
  lang: Locale;
  dict: Dictionary;
  entries: SocialEntry[];
}

export default function FollowerStrip({ lang, dict, entries }: FollowerStripProps) {
  if (entries.length === 0) return null;

  const t = dict.home.audience;

  return (
    <section className="py-20 sm:py-28 border-y border-border bg-bg-1/40">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 mb-10 flex flex-col gap-2">
        <span className="font-mono text-xs tracking-[0.2em] text-matrix">{t.eyebrow}</span>
        <h2 className="font-display font-bold tracking-tight text-text-0 text-3xl sm:text-4xl">
          {t.title}
        </h2>
        <p className="text-text-2 text-base">{t.subtitle}</p>
      </div>

      <Marquee speed={48}>
        {entries.map((e) => (
          <a
            key={e.url}
            href={e.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-baseline gap-3 px-6 py-2 whitespace-nowrap"
          >
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-text-2 group-hover:text-matrix transition-colors duration-[var(--duration-fast)]">
              {PLATFORM_LABELS[e.platform]}
            </span>
            <span className="font-display font-bold text-2xl sm:text-3xl text-text-0 group-hover:text-matrix transition-colors duration-[var(--duration-fast)]">
              {formatFollowers(e.followers, lang)}
            </span>
            <span className="font-mono text-xs text-text-2 group-hover:text-text-1 transition-colors duration-[var(--duration-fast)]">
              {e.handle}
            </span>
            <span className="font-mono text-text-2 select-none ms-3" aria-hidden>
              ·
            </span>
          </a>
        ))}
      </Marquee>
    </section>
  );
}
