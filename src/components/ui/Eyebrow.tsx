import type { ElementType, ReactNode } from 'react';

interface EyebrowProps {
  /** Legacy dictionary strings may start with "// " — it is stripped. */
  text?: string;
  children?: ReactNode;
  as?: ElementType;
  className?: string;
  id?: string;
}

/**
 * Mono uppercase label above section titles (brief §3.2/§3.3):
 * JetBrains Mono, letter-spacing .12em, Signal Green. Static — no scramble.
 */
export default function Eyebrow({ text, children, as: Tag = 'p', className = '', id }: EyebrowProps) {
  const content = children ?? text?.replace(/^\/\/\s*/, '');
  return (
    <Tag id={id} className={`font-mono text-xs uppercase tracking-[0.12em] text-signal ${className}`}>
      {content}
    </Tag>
  );
}
