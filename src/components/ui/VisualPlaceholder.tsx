interface VisualPlaceholderProps {
  /** Manifest ID from brief §6.2, e.g. "V02". */
  id: string;
  /** Alt text the final image will carry. */
  alt: string;
  ratio?: string;
  label: string;
  className?: string;
}

/**
 * Visible stand-in for a visual that is not made or approved yet.
 * Replace with the approved file from /public/brand once the manifest says "approved".
 */
export default function VisualPlaceholder({ id, alt, ratio = '4 / 3', label, className = '' }: VisualPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      data-visual={id}
      style={{ aspectRatio: ratio }}
      className={`relative w-full overflow-hidden rounded-[var(--radius-md)] border border-dashed border-line bg-panel flex flex-col items-center justify-center gap-1 p-4 text-center ${className}`}
    >
      <span className="font-mono text-xs tracking-[0.12em] text-signal">[VISUAL {id}]</span>
      <span className="font-mono text-[11px] text-muted">{label}</span>
    </div>
  );
}
