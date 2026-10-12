import { BRAND } from '@/lib/brand';

interface WordmarkProps {
  className?: string;
}

/** RIYAD KETAMI_ — Space Grotesk 700 with a solid Signal Green cursor bar (brief §3.3, §4). */
export default function Wordmark({ className = '' }: WordmarkProps) {
  return (
    <span className={`inline-flex items-baseline font-display font-bold tracking-[0.02em] ${className}`}>
      <span>{BRAND.wordmark}</span>
      <span aria-hidden className="ms-[0.08em] inline-block h-[0.14em] w-[0.6em] translate-y-[0.02em] bg-signal" />
    </span>
  );
}
