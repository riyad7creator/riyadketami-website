'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
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
        className="flex gap-8 animate-marquee"
        style={
          {
            '--duration': duration,
            '--direction': reverse ? 'reverse' : 'normal',
            animationPlayState: pauseOnHover ? undefined : 'running',
          } as React.CSSProperties
        }
      >
        {children}
        {children}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee var(--duration, 30s) linear var(--direction, normal) infinite;
        }
        .animate-marquee:hover {
          animation-play-state: ${pauseOnHover ? 'paused' : 'running'};
        }
      `}</style>
    </div>
  );
}
