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
      className={`group inline-flex items-center gap-2 font-mono text-sm text-matrix w-fit ${className}`}
    >
      {children}
      <ArrowRight
        size={14}
        className="transition-transform duration-[var(--duration-fast)] group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
      />
    </Link>
  );
}
