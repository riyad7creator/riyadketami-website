import type { PillVariant } from '@/models/LinkCard';

const VARIANT_STYLES: Record<string, string> = {
  sponsored: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  new: 'bg-matrix/10 text-matrix border-matrix/20',
  free: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  booking: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  affiliate: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  custom: 'bg-bg-1 text-text-1 border-border',
};

export default function Pill({
  label,
  variant = 'custom',
  color,
}: {
  label: string;
  variant?: PillVariant | string;
  color?: string;
}) {
  const cls = VARIANT_STYLES[variant] ?? VARIANT_STYLES.custom;
  const customStyle =
    variant === 'custom' && color
      ? { color, borderColor: `${color}33`, backgroundColor: `${color}1a` }
      : undefined;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold tracking-[0.12em] border uppercase ${cls}`}
      style={customStyle}
    >
      {label}
    </span>
  );
}
