import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Pill from './Pill';

interface LinkCardProps {
  href: string;
  title: string;
  description?: string;
  tag?: string;
  external?: boolean;
  className?: string;
}

export default function LinkCard({
  href,
  title,
  description,
  tag,
  external = false,
  className = '',
}: LinkCardProps) {
  const props = external
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Link
      href={href}
      {...props}
      className={`group flex items-start justify-between gap-4 glass border border-border hover:border-border-hover rounded-[var(--radius-lg)] p-5 transition-colors duration-[var(--duration-base)] ${className}`}
    >
      <div className="flex flex-col gap-2 min-w-0">
        {tag && <Pill variant="neutral">{tag}</Pill>}
        <span className="font-semibold text-text-0 group-hover:text-matrix transition-colors duration-[var(--duration-fast)] truncate">
          {title}
        </span>
        {description && (
          <span className="text-sm text-text-2 line-clamp-2">{description}</span>
        )}
      </div>
      <ArrowUpRight
        size={16}
        className="shrink-0 text-text-2 group-hover:text-matrix transition-colors duration-[var(--duration-fast)] mt-1"
      />
    </Link>
  );
}
