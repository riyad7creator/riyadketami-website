import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import MatrixText from '@/components/ui/MatrixText';
import Pill from './Pill';
import { relativeTime, isNew } from '@/lib/rss-fetcher';

interface LatestItem {
  source: { type: string; label: string };
  item: {
    title: string;
    link: string;
    publishedAt: Date;
    thumbnail?: string;
  };
}

const TYPE_ICON: Record<string, string> = {
  youtube: '▶',
  blog: '◈',
  tiktok: '◉',
  instagram: '◧',
};

export default function LatestSection({ items }: { items: LatestItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-2.5" aria-label="Latest content">
      <MatrixText
        text="// latest"
        className="font-mono text-[10px] tracking-[0.2em] text-matrix px-1"
      />
      <div className="flex flex-col gap-2.5">
        {items.map(({ source, item }) => {
          const isExternal = item.link.startsWith('http');
          const hasDate = item.publishedAt.getTime() > 0;
          const fresh = hasDate && isNew(item.publishedAt);

          return (
            <a
              key={item.link}
              href={item.link}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="group glass rounded-[var(--radius-md)] px-4 py-3.5 flex items-start gap-4 hover:border-matrix/35 transition-all duration-[var(--duration-fast)]"
            >
              {item.thumbnail ? (
                <div className="relative w-14 h-10 rounded shrink-0 overflow-hidden border border-border">
                  <Image
                    src={item.thumbnail}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                </div>
              ) : (
                <span
                  className="w-8 shrink-0 text-matrix font-mono text-base mt-0.5 text-center select-none"
                  aria-hidden
                >
                  {TYPE_ICON[source.type] ?? '→'}
                </span>
              )}

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-text-2 uppercase">
                    {source.label}
                  </span>
                  {fresh && <Pill label="new" variant="new" />}
                </div>
                <p className="text-sm font-medium text-text-0 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </p>
                {hasDate && (
                  <p className="text-[10px] font-mono text-text-2 mt-0.5">
                    {relativeTime(item.publishedAt)}
                  </p>
                )}
              </div>

              <ExternalLink
                size={12}
                className="text-text-2 group-hover:text-matrix transition-colors shrink-0 mt-0.5"
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}
