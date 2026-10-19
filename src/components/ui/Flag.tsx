interface FlagProps {
  kind: 'VERIFY' | 'MISSING';
  children: React.ReactNode;
  className?: string;
}

/**
 * Visible marker for a brief item that must not be guessed (brief §0, §8).
 * MISSING flags get the prefix here; VERIFY text carries its own wording.
 */
export default function Flag({ kind, children, className = '' }: FlagProps) {
  // Editorial markers are for the build team only, never for visitors.
  if (process.env.NODE_ENV === 'production') return null;
  return (
    <span
      data-flag={kind}
      className={`inline-block font-mono text-[11px] uppercase tracking-[0.08em] text-warning border border-warning/40 rounded-[var(--radius-sm)] px-1.5 py-0.5 ${className}`}
    >
      [{kind === 'MISSING' ? <>MISSING: {children}</> : children}]
    </span>
  );
}
