import type { ReactNode } from 'react';

type PillVariant = 'matrix' | 'accent' | 'neutral' | 'danger' | 'warning';

interface PillProps {
  children: ReactNode;
  variant?: PillVariant;
  className?: string;
}

const styles: Record<PillVariant, string> = {
  matrix: 'bg-matrix/10 text-matrix border-matrix/20',
  accent: 'bg-accent/10 text-accent border-accent/20',
  neutral: 'bg-surface text-text-2 border-border',
  danger: 'bg-danger/10 text-danger border-danger/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
};

export default function Pill({ children, variant = 'neutral', className = '' }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
