'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
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
  primary: 'bg-matrix text-bg-0 hover:bg-matrix/90 font-semibold',
  secondary: 'glass border-border text-text-0 hover:border-border-hover',
  ghost: 'text-text-1 hover:text-text-0 hover:bg-surface',
  danger: 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-10 px-5 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-7 text-base rounded-[var(--radius-md)]',
};

const MotionLink = motion.create(Link);

// Press feedback is a spring so rapid taps inherit velocity instead of queueing tweens.
const pressProps = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 500, damping: 30 },
} as const;

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, children, className = '', disabled, href, target, rel, ...props }, ref) => {
    const base =
      'relative inline-flex items-center justify-center gap-2 cursor-pointer select-none transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 disabled:pointer-events-none';
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
        <MotionLink
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={rel}
          {...pressProps}
          className={classes}
          aria-busy={loading || undefined}
        >
          {content}
        </MotionLink>
      );
    }

    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        {...pressProps}
        className={classes}
        disabled={disabled ?? loading}
        aria-busy={loading || undefined}
        {...(props as ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {content}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
