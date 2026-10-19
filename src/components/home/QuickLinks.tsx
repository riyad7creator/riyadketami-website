import { ArrowUpRight, Link2, Mail, Youtube } from 'lucide-react';
import Eyebrow from '@/components/ui/Eyebrow';
import { getSiteLinks } from '@/lib/site-content';
import type { Dictionary } from '@/lib/dictionaries';

interface QuickLinksProps {
  dict: Dictionary;
  className?: string;
}

/**
 * Link-in-bio list (mirrors linktr.ee/riyadketami; editable in rk-studio → Content).
 * Algeria Business Bay is not a row here: it has its own cover block on both pages.
 * Partner links always carry the PARTNER label.
 */
export async function QuickLinkList({ dict }: { dict: Dictionary }) {
  const t = dict.home.quick_links;
  const localized: Record<string, string> = { youtube: t.youtube, collab: t.collab };
  const links = await getSiteLinks();

  return (
    <ol className="flex flex-col divide-y divide-line border-y border-line">
      {links.map((l) => {
        const external = !l.url.startsWith('mailto:');
        const Fallback = l.url.startsWith('mailto:') ? Mail : /youtube\.com|youtu\.be/.test(l.url) ? Youtube : Link2;
        return (
          <li key={l.key}>
            <a
              href={l.url}
              {...(external ? { target: '_blank', rel: 'noopener' } : {})}
              className="group flex min-h-[64px] items-center gap-4 px-1 py-2 transition-colors duration-[var(--duration-fast)] hover:bg-panel"
            >
              {/* Logo slot: partner logo/icon (editable in rk-studio → Content → Links) */}
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] ${l.icon ? 'bg-white' : 'border border-line bg-panel'}`}>
                {l.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.icon} alt="" loading="lazy" className="h-full w-full object-contain p-1.5" />
                ) : (
                  <Fallback size={18} aria-hidden className="text-muted" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-paper">
                <span className="min-w-0">{localized[l.key] ?? l.label}</span>
                {l.partner && (
                  <span className="font-mono text-[11px] tracking-[0.12em] text-signal">{t.partner_label}</span>
                )}
              </span>
              <ArrowUpRight size={16} aria-hidden className="shrink-0 text-muted rtl-flip" />
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export default function QuickLinks({ dict, className = '' }: QuickLinksProps) {
  return (
    <section aria-labelledby="quick-links" className={`px-4 py-16 sm:px-8 ${className}`}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <Eyebrow as="h2" id="quick-links">
          {dict.home.quick_links.eyebrow}
        </Eyebrow>
        <div className="max-w-2xl">
          <QuickLinkList dict={dict} />
        </div>
      </div>
    </section>
  );
}
