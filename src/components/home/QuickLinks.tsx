import { ArrowUpRight } from 'lucide-react';
import Eyebrow from '@/components/ui/Eyebrow';
import Ar from '@/components/ui/Ar';
import Flag from '@/components/ui/Flag';
import { BRAND } from '@/lib/brand';
import type { Dictionary } from '@/lib/dictionaries';

interface QuickLinksProps {
  dict: Dictionary;
  className?: string;
}

interface QuickLink {
  key: string;
  label: React.ReactNode;
  url: string | null;
  /** Shown instead of a link while the brief marks the target as missing. */
  missing?: string;
  partner?: boolean;
}

/**
 * Brief §2.3 link-in-bio block: max 5, ABB always first, at most one sponsor
 * and it is always labelled PARTNER. Shared by the home page and /links.
 */
export function quickLinks(dict: Dictionary): QuickLink[] {
  const t = dict.home.quick_links;
  return [
    { key: 'abb', label: t.abb, url: BRAND.abb.url },
    {
      key: 'telegram',
      label: (
        <>
          {t.telegram} (<Ar>{t.telegram_ar}</Ar>)
        </>
      ),
      url: BRAND.telegramUrl,
    },
    {
      key: 'partner',
      label: BRAND.partnerLink?.label ?? t.partner,
      url: BRAND.partnerLink?.url ?? null,
      missing: 'sponsor URL',
      partner: true,
    },
    { key: 'youtube', label: t.youtube, url: BRAND.youtubeUrl },
    { key: 'linkedin', label: t.linkedin, url: BRAND.linkedinUrl, missing: 'LinkedIn URL' },
  ];
}

export function QuickLinkList({ dict }: { dict: Dictionary }) {
  const t = dict.home.quick_links;
  return (
    <ol className="flex flex-col divide-y divide-line border-y border-line">
      {quickLinks(dict)
        // In production, a link without a target is hidden rather than shown empty.
        .filter((l) => l.url || process.env.NODE_ENV !== 'production')
        .map((l) => {
        const inner = (
          <>
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-paper">
              <span className="truncate">{l.label}</span>
              {l.partner && (
                <span className="font-mono text-[11px] tracking-[0.12em] text-signal">{t.partner_label}</span>
              )}
              {!l.url && l.missing && <Flag kind="MISSING">{l.missing}</Flag>}
            </span>
            {l.url && <ArrowUpRight size={16} aria-hidden className="shrink-0 text-muted rtl-flip" />}
          </>
        );
        return (
          <li key={l.key}>
            {l.url ? (
              <a
                href={l.url}
                target="_blank"
                rel="noopener"
                className="group flex min-h-[56px] items-center gap-4 px-1 transition-colors duration-[var(--duration-fast)] hover:bg-panel"
              >
                {inner}
              </a>
            ) : (
              <div className="flex min-h-[56px] items-center gap-4 px-1 opacity-80">{inner}</div>
            )}
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
