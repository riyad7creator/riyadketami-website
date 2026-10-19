export const inputCls =
  'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors duration-[var(--duration-fast)]';
export const btnGhost =
  'inline-flex items-center gap-2 px-3 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover disabled:opacity-40 transition-colors duration-[var(--duration-fast)]';
export const btnPrimary =
  'inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]';
export const LANG_LABEL: Record<string, string> = { en: 'EN', fr: 'FR', ar: 'AR' };
export const LANG_NAME: Record<string, string> = { en: 'English', fr: 'French', ar: 'Arabic' };

export function pct(n: number | undefined, d: number | undefined): string {
  if (!d || !n) return '0%';
  return `${((n / d) * 100).toFixed(1)}%`;
}
