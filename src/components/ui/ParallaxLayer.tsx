'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxLayerProps {
  children: React.ReactNode;
  /** How fast the layer moves relative to scroll. 0 = no movement, 0.2 = subtle, 0.5 = strong. Negative = opposite direction. */
  speed?: number;
  className?: string;
}

/**
 * Wraps children in a parallax scroll container.
 * Tracks scroll progress from when element enters to when it exits the viewport.
 * speed > 0 → element moves up (slower than scroll = appears to lag behind).
 * speed < 0 → element moves down (faster than scroll = pushes ahead).
 */
export default function ParallaxLayer({
  children,
  speed = 0.2,
  className = '',
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Convert speed to pixel range: at speed=0.2 on a 800px section → 160px total travel
  const yRange = speed * 200;
  const y = useTransform(scrollYProgress, [0, 1], [`${yRange}px`, `-${yRange}px`]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        style={{
          y,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
