import { ExternalLink } from 'lucide-react';
import { Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import type { LinkEntry } from '@/lib/home-data';
import type { Dictionary } from '@/lib/dictionaries';

interface LinksSectionProps {
  links: LinkEntry[];
  dict: Dictionary;
}

const ICON_MAP: Record<string, string> = {
  youtube: '▶',
  tiktok: '◈',
  instagram: '◉',
  facebook: '◧',
  twitter: '✦',
  x: '✦',
  linkedin: '◧',
  github: '⬡',
  newsletter: '✉',
  book: '◻',
  star: '★',
  link: '→',
};

function resolveIcon(icon?: string): string {
  return ICON_MAP[icon ?? 'link'] ?? '→';
}

export default function LinksSection({ links, dict }: LinksSectionProps) {
  const t = dict.home.links;

  return (
    <section className="py-16 sm:py-20 px-5 sm:px-8">
      <div className="max-w-xl mx-auto flex flex-col gap-8">
        <Reveal direction="up">
          <div className="text-center flex flex-col gap-2">
            <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
            <h2 className="font-display font-bold text-text-0 text-2xl sm:text-3xl">{t.title}</h2>
          </div>
        </Reveal>

        {links.length > 0 ? (
          <div className="flex flex-col gap-3">
            {links.map((link, i) => (
              <Reveal key={link.id} direction="up" delay={i * 0.06}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass rounded-[var(--radius-md)] px-5 py-4 flex items-center gap-4 hover:border-border-hover hover:bg-surface-hover transition-all duration-[var(--duration-fast)]"
                >
                  <span
                    className="font-mono text-lg text-matrix shrink-0 w-6 text-center"
                    aria-hidden
                  >
                    {resolveIcon(link.icon)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-text-0 group-hover:text-matrix transition-colors duration-[var(--duration-fast)] truncate">
                      {link.title}
                    </div>
                    {link.description && (
                      <div className="text-xs text-text-2 mt-0.5 truncate">{link.description}</div>
                    )}
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-text-2 group-hover:text-matrix transition-colors shrink-0"
                  />
                </a>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal direction="up" delay={0.08}>
            <div className="flex flex-col gap-3">
              {[
                { title: 'Newsletter: Weekly AI & Business Insights', icon: 'newsletter' },
                { title: 'AI Business Masterclass', icon: 'star' },
                { title: 'Book a Strategy Session', icon: 'link' },
              ].map((placeholder, i) => (
                <div
                  key={i}
                  className="glass rounded-[var(--radius-md)] px-5 py-4 flex items-center gap-4 opacity-40 cursor-not-allowed"
                >
                  <span className="font-mono text-lg text-matrix shrink-0 w-6 text-center" aria-hidden>
                    {resolveIcon(placeholder.icon)}
                  </span>
                  <div className="flex-1 font-semibold text-sm text-text-0 truncate">
                    {placeholder.title}
                  </div>
                  <ExternalLink size={14} className="text-text-2 shrink-0" />
                </div>
              ))}
              <p className="text-center font-mono text-[10px] tracking-[0.15em] text-text-2 pt-1">
                // links managed from admin dashboard
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
