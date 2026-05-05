import type { ReactNode } from 'react';

interface BadgeProps {
  count?: number;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Badge({ count, dot, children, className = '' }: BadgeProps) {
  return (
    <span className={`relative inline-flex ${className}`}>
      {children}
      {(dot || (count !== undefined && count > 0)) && (
        <span
          className={`absolute -top-1 -end-1 flex items-center justify-center bg-matrix text-bg-0 font-bold leading-none ${
            dot ? 'h-2 w-2 rounded-full' : 'min-w-[18px] h-[18px] px-1 rounded-full text-[10px]'
          }`}
        >
          {!dot && count}
        </span>
      )}
    </span>
  );
}
