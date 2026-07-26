'use client';

import { useRef, useState, useEffect, type ComponentType } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Brain, Handshake, Mic, Check, type LucideProps } from 'lucide-react';
import { Button } from '@/components/ui';

const SERVICE_ICONS: ComponentType<LucideProps>[] = [Brain, Handshake, Mic];

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
  // Mobile-only: tap-selected state, distinct from transient hover/touch press.
  // Workshop card (index 2) only shows its strong CTA when hovered (desktop)
  // OR selected (mobile). Tap outside any card clears selection.
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    if (!selected) return;
    const handleOutside = (e: PointerEvent) => {
      if (!cardRef.current?.contains(e.target as Node)) setSelected(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [selected]);

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

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const touch = e.touches[0];
    if (!touch) return;
    const { xNorm, yNorm } = getRelativePos(touch.clientX, touch.clientY);
    rawX.set(xNorm);
    rawY.set(yNorm);
    // Toggle the persistent selected state; transient `hovered` follows the press.
    setHovered(true);
    setSelected((prev) => !prev);
  }

  function handleTouchEnd() {
    rawX.set(0);
    rawY.set(0);
    setHovered(false);
  }

  const emphasized = hovered || selected;
  const Icon = SERVICE_ICONS[index] ?? Brain;

  return (
    <div className="h-full" style={{ perspective: '1000px' }}>
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
          style={{
            opacity: emphasized ? 1 : 0,
            background: `radial-gradient(circle at ${sheenPos.x}% ${sheenPos.y}%, rgba(0,255,136,0.1) 0%, transparent 55%)`,
          }}
          aria-hidden
        />

        {/* Service icon */}
        <div className="w-12 h-12 flex items-center justify-center text-matrix/80">
          <Icon strokeWidth={1.5} className="w-full h-full" aria-hidden />
        </div>

        {/* Tag */}
        <span className="font-mono text-[10px] tracking-[0.15em] text-matrix border border-matrix/30 rounded-full px-2.5 py-1 w-fit">
          {item.tag}
        </span>

        {/* Name + description — fixed min-heights keep cards aligned across languages */}
        <div className="flex flex-col gap-2">
          <h2 className="font-display font-bold text-2xl text-text-0 leading-tight min-h-[3.75rem]">
            {item.name}
          </h2>
          <p className="text-text-2 text-sm leading-relaxed min-h-[7rem]">{item.description}</p>
        </div>

        {/* Features — flex-1 absorbs vertical slack so CTAs align */}
        <ul className="flex flex-col gap-2.5 flex-1 min-h-[7rem]">
          {item.features.map((f, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-text-1">
              <Check size={13} className="text-matrix shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="pt-2">
          <Link href={`/${lang}/contact`}>
            <Button
              variant="secondary"
              className={`w-full hover:bg-matrix hover:text-bg-0 hover:border-matrix hover:shadow-[0_0_20px_rgba(0,255,102,0.25)] ${
                selected ? 'bg-matrix text-bg-0 border-matrix shadow-[0_0_20px_rgba(0,255,102,0.25)]' : ''
              }`}
            >
              {item.cta}
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
