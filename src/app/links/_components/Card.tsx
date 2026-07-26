import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Pill from './Pill';
import type { PillVariant } from '@/models/LinkCard';

export interface CardProps {
  _id: string;
  title: string;
  description?: string;
  href: string;
  icon?: string;
  thumbnail?: string;
  pillLabel?: string;
  pillVariant?: PillVariant;
  pillColor?: string;
  featured?: boolean;
}

function resolveLucideIcon(name?: string) {
  if (!name) return null;
  const pascal = name
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  const Icon = (LucideIcons as Record<string, unknown>)[pascal];
  return typeof Icon === 'function'
    ? (Icon as React.ComponentType<{ size?: number; className?: string }>)
    : null;
}

export default function Card({
  title,
  description,
  href,
  icon,
  thumbnail,
  pillLabel,
  pillVariant,
  pillColor,
  featured,
}: CardProps) {
  const isExternal = href.startsWith('http');
  const Icon = resolveLucideIcon(icon);

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={`group flex items-start gap-4 rounded-[var(--radius-md)] px-5 py-4 transition-all duration-[var(--duration-fast)] ${
        featured
          ? 'bg-matrix/5 border border-matrix/30 hover:border-matrix/60 hover:bg-matrix/8'
          : 'glass hover:border-matrix/35'
      }`}
      style={featured ? { boxShadow: '0 0 30px rgba(var(--matrix-rgb), 0.06)' } : undefined}
    >
      {thumbnail ? (
        <div className="relative w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden shrink-0 border border-border">
          <Image src={thumbnail} alt="" fill className="object-cover" sizes="48px" />
        </div>
      ) : Icon ? (
        <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-bg-1 border border-border flex items-center justify-center shrink-0 group-hover:border-matrix/30 transition-colors">
          <Icon size={16} className="text-text-2 group-hover:text-matrix transition-colors" />
        </div>
      ) : null}

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-0 group-hover:text-white transition-colors">
            {title}
          </span>
          {pillLabel && (
            <Pill label={pillLabel} variant={pillVariant} color={pillColor} />
          )}
        </div>
        {description && (
          <span className="text-xs text-text-2 group-hover:text-text-1 transition-colors leading-relaxed">
            {description}
          </span>
        )}
      </div>

      <ArrowUpRight
        size={14}
        className={`shrink-0 mt-0.5 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
          featured ? 'text-matrix' : 'text-text-2 group-hover:text-matrix'
        }`}
      />
    </a>
  );
}
