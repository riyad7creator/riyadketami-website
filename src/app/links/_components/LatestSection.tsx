import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import Eyebrow from '@/components/ui/Eyebrow';
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


export default function LatestSection({ items, label }: { items: LatestItem[]; label: string }) {
  if (items.length === 0) return null;

  return (
    <section className="w-full flex flex-col gap-3">
      <Eyebrow as="h2">{label}</Eyebrow>
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
              className="group rounded-[var(--radius-md)] border border-line bg-panel px-4 py-3.5 flex items-start gap-4 hover:border-paper/40 transition-colors duration-[var(--duration-fast)]"
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
              ) : null}

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] tracking-[0.12em] text-text-2 uppercase">
                    {source.label}
                  </span>
                  {fresh && <Pill label="new" variant="new" />}
                </div>
                <p className="text-sm font-medium text-text-0 group-hover:text-paper transition-colors line-clamp-2 leading-snug">
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
                className="text-text-2 group-hover:text-paper transition-colors shrink-0 mt-0.5"
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}
