import type { ElementType, ReactNode } from 'react';

interface ArProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
}

/** Every Arabic run gets dir="rtl" lang="ar" (brief §3.2), whatever the page locale. */
export default function Ar({ children, as: Tag = 'span', className = '' }: ArProps) {
  return (
    <Tag dir="rtl" lang="ar" className={`font-arabic ${className}`}>
      {children}
    </Tag>
  );
}

/** Wraps any Arabic-script substring of a mixed string, e.g. "AI بالدارجة". */
export function withArabic(text: string): ReactNode {
  const parts = text.split(/([؀-ۿ][؀-ۿ\s،.]*[؀-ۿ.،]|[؀-ۿ])/);
  if (parts.length === 1) return text;
  return parts.map((p, i) => (/[؀-ۿ]/.test(p) ? <Ar key={i}>{p}</Ar> : p));
}
