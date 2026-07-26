'use client';

import type { ReactNode } from 'react';

interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  reverse?: boolean;
  pauseOnHover?: boolean;
  className?: string;
}

export default function Marquee({
  children,
  speed = 30,
  reverse = false,
  pauseOnHover = true,
  className = '',
}: MarqueeProps) {
  const duration = `${speed}s`;

  return (
    <div className={`flex overflow-hidden select-none ${className}`}>
      <div
        className={`flex animate-marquee ${pauseOnHover ? 'marquee-pausable' : ''}`}
        style={
          {
            '--duration': duration,
            '--direction': reverse ? 'reverse' : 'normal',
          } as React.CSSProperties
        }
      >
        {/* Each copy carries its own trailing gap (pe-8) so both halves are
            geometrically identical and the -50% wrap point is seamless. */}
        <div className="flex gap-8 pe-8 shrink-0">{children}</div>
        <div className="flex gap-8 pe-8 shrink-0" aria-hidden>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee var(--duration, 30s) linear var(--direction, normal) infinite;
        }
        .marquee-pausable:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
