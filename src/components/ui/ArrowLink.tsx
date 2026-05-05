import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface ArrowLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function ArrowLink({ href, children, className = '' }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-mono text-sm text-matrix hover:gap-3 transition-all duration-[var(--duration-base)] w-fit ${className}`}
    >
      {children}
      <ArrowRight size={14} className="rtl:rotate-180" />
    </Link>
  );
}
