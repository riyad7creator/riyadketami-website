import type { PillVariant } from '@/models/LinkCard';

/**
 * The brand is two-colour (brand book 05). Signal Green is reserved for the
 * one pill that is genuinely a signal — "new". Disclosure labels (sponsored,
 * affiliate) and the rest stay neutral so green keeps its scarcity.
 */
const VARIANT_STYLES: Record<string, string> = {
  sponsored: 'bg-bg-2 text-text-2 border-border',
  new: 'bg-matrix/10 text-matrix border-matrix/20',
  free: 'bg-surface text-text-1 border-border',
  booking: 'bg-surface text-text-1 border-border',
  affiliate: 'bg-bg-2 text-text-2 border-border',
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
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold tracking-[0.12em] border uppercase ${cls}`}
      style={customStyle}
    >
      {label}
    </span>
  );
}
