'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  tilt?: boolean;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, tilt = false, glow = false, className = '', onClick }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 30 });
  const glowX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);
  // Must be called unconditionally (Rules of Hooks) even though its result is only used when `glow` is true.
  const glowBackground = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(0,255,102,0.08) 0%, transparent 60%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={tilt ? { rotateX, rotateY, transformPerspective: 1000 } : undefined}
      whileHover={glow ? { scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`glass rounded-[var(--radius-lg)] relative overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {glow && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[var(--radius-lg)] opacity-0 group-hover:opacity-100"
          style={{ background: glowBackground }}
        />
      )}
      {children}
    </motion.div>
  );
}
