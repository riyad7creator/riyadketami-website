'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** When set, renders a Next.js <Link> styled as a button — never nest Button inside <Link>. */
  href?: string;
  target?: string;
  rel?: string;
}

const variants: Record<Variant, string> = {
  // Ink text on Signal Green — white on green fails contrast (brief §3.1)
  primary: 'bg-signal text-ink hover:bg-signal/90 font-medium',
  secondary: 'bg-transparent border border-line text-paper hover:border-paper/60',
  ghost: 'text-text-1 hover:text-text-0 hover:bg-surface',
  danger: 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'min-h-[44px] px-5 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-7 text-base rounded-[var(--radius-md)]',
};

// Press feedback is a CSS scale (active:scale-[0.97]) so no animation library ships.

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, children, className = '', disabled, href, target, rel, ...props }, ref) => {
    const base =
      'relative inline-flex items-center justify-center gap-2 cursor-pointer select-none transition-[color,background-color,border-color,transform] duration-[var(--duration-fast)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 disabled:pointer-events-none';
    const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

    // Label stays mounted (opacity 0) while loading so the button never changes width.
    const content = (
      <>
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          </span>
        )}
        <span className={`inline-flex items-center gap-2 ${loading ? 'opacity-0' : ''}`}>{children}</span>
      </>
    );

    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={rel}
          className={classes}
          aria-busy={loading || undefined}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        disabled={disabled ?? loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
