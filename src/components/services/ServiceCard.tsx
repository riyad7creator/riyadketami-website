'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui';

const SERVICE_ICONS = [
  '/icons/icon-ai.png',
  '/icons/icon-workshop.png',
  '/icons/icon-speaking.png',
] as const;

interface ServiceItem {
  tag: string;
  name: string;
  description: string;
  features: string[];
  cta: string;
}

interface ServiceCardProps {
  item: ServiceItem;
  lang: string;
  index?: number;
}

export default function ServiceCard({ item, lang, index = 0 }: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  // Tilt + sheen are pure motion values — mousemove never triggers a React re-render
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 20 });
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 20 });
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(50);
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(var(--matrix-rgb), 0.1) 0%, transparent 55%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    rawX.set(xPct / 100 - 0.5);
    rawY.set(yPct / 100 - 0.5);
    sheenX.set(xPct);
    sheenY.set(yPct);
  }

  function handleMouseEnter() {
    setHovered(true);
  }

  function handleMouseLeave() {
    setHovered(false);
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <div style={{ perspective: '1000px' }}>
      <motion.div
        ref={cardRef}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative flex flex-col gap-6 h-full rounded-[var(--radius-lg)] p-8 border border-white/10 bg-white/[0.02] hover:border-matrix/40 hover:bg-matrix/[0.04] hover:shadow-[0_0_60px_rgba(var(--matrix-rgb),0.06)] transition-colors duration-200 cursor-default select-none"
      >
        {/* Radial sheen that follows the cursor */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0, background: sheen }}
          aria-hidden
        />

        {/* Service icon */}
        {SERVICE_ICONS[index] && (
          <div className="w-12 h-12 relative opacity-80">
            <Image
              src={SERVICE_ICONS[index]!}
              alt=""
              fill
              className="object-contain"
              sizes="48px"
              aria-hidden
            />
          </div>
        )}

        {/* Tag */}
        <span className="font-mono text-[10px] tracking-[0.15em] text-matrix border border-matrix/30 rounded-full px-2.5 py-1 w-fit">
          {item.tag}
        </span>

        {/* Name + description */}
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-2xl text-text-0 leading-tight">
            {item.name}
          </h2>
          <p className="text-text-2 text-sm leading-relaxed">{item.description}</p>
        </div>

        {/* Features */}
        <ul className="flex flex-col gap-2.5 flex-1">
          {item.features.map((f, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-text-1">
              <Check size={13} className="text-matrix shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="pt-2">
          <Button href={`/${lang}/contact`} variant="secondary" className="w-full">
            {item.cta}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
