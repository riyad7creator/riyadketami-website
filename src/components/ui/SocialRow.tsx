import { BRAND } from '@/lib/brand';

interface SocialRowProps {
  className?: string;
}

/** Brief §5.3 profiles as text links with 44px hit areas. No follower counts, ever. */
export default function SocialRow({ className = '' }: SocialRowProps) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-1 gap-y-1 ${className}`}>
      {BRAND.socials.map((s) => (
        <li key={s.key}>
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${s.label} (${s.handle})`}
            className="inline-flex min-h-[44px] items-center px-2 font-mono text-xs tracking-[0.08em] text-muted hover:text-paper transition-colors duration-[var(--duration-fast)]"
          >
            {s.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
