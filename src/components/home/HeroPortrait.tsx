'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import HeroCanvas from './HeroCanvas';

interface HeroPortraitProps {
  src: string;
}

export default function HeroPortrait({ src }: HeroPortraitProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Track scroll progress of the hero section as it exits the viewport
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // Real photo fades out as user scrolls (0→40% scroll)
  const photoOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  // Matrix effect fades in as user scrolls (10→55% scroll)
  const matrixOpacity = useTransform(scrollYProgress, [0.08, 0.55], [0, 1]);
  // Subtle scale-down on photo for depth
  const photoScale = useTransform(scrollYProgress, [0, 0.45], [1, 0.96]);

  // Suspend the particle canvas while its layer is fully transparent —
  // no reason to burn frames on an invisible 2,200-particle sim.
  const [canvasActive, setCanvasActive] = useState(false);
  useMotionValueEvent(matrixOpacity, 'change', (v) => setCanvasActive(v > 0.01));

  return (
    <div ref={ref} className="relative w-full h-full">
      {/* Layer 1: Real portrait — visible on load, dissolves on scroll */}
      <motion.div
        style={{ opacity: photoOpacity, scale: photoScale }}
        className="absolute inset-0 z-10 rounded-[var(--radius-lg)] overflow-hidden"
      >
        <Image
          src={src}
          alt="Riyad Ketami"
          fill
          className="object-cover object-top"
          priority
          sizes="(max-width: 768px) 90vw, 480px"
        />
        {/* Subtle green tint overlay at edges */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, rgba(var(--matrix-rgb), 0.06) 100%)',
          }}
          aria-hidden
        />
        {/* Bottom gradient into page background */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: 'linear-gradient(to top, rgba(10,11,13,0.6), transparent)' }}
          aria-hidden
        />
      </motion.div>

      {/* Layer 2: Matrix canvas — invisible on load, appears on scroll */}
      <motion.div
        style={{ opacity: matrixOpacity }}
        className="absolute inset-0 z-20"
      >
        <HeroCanvas src={src} paused={!canvasActive} />
      </motion.div>

      {/* Ambient glow ring */}
      <div
        className="absolute inset-0 rounded-[var(--radius-lg)] pointer-events-none z-0"
        style={{
          boxShadow: '0 0 60px rgba(var(--matrix-rgb), 0.07), inset 0 0 40px rgba(var(--matrix-rgb), 0.03)',
        }}
        aria-hidden
      />
    </div>
  );
}
