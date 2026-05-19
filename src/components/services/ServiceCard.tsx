'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 });
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

  // Framer Motion spring values for tilt
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 20 });
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 20 });

  function getRelativePos(clientX: number, clientY: number) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return { xNorm: 0, yNorm: 0, xPct: 50, yPct: 50 };
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const yPct = ((clientY - rect.top) / rect.height) * 100;
    return {
      xNorm: xPct / 100 - 0.5,
      yNorm: yPct / 100 - 0.5,
      xPct,
      yPct,
    };
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { xNorm, yNorm, xPct, yPct } = getRelativePos(e.clientX, e.clientY);
    rawX.set(xNorm);
    rawY.set(yNorm);
    setSheenPos({ x: xPct, y: yPct });
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

  return (
    <div style={{ perspective: '1000px' }}>
      <motion.div
        ref={cardRef}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex flex-col gap-6 h-full rounded-[var(--radius-lg)] p-8 border border-white/10 bg-white/[0.02] hover:border-matrix/40 hover:bg-matrix/[0.04] hover:shadow-[0_0_60px_rgba(0,255,102,0.06)] transition-colors duration-200 cursor-default select-none"
      >
        {/* Radial sheen that follows the cursor */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] transition-opacity duration-200"
          style={{
            opacity: emphasized ? 1 : 0,
            background: `radial-gradient(circle at ${sheenPos.x}% ${sheenPos.y}%, rgba(0,255,136,0.1) 0%, transparent 55%)`,
          }}
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
          <Link href={`/${lang}/contact`}>
            <Button
              variant="secondary"
              className={`w-full ${
                index === 2
                  ? `hover:bg-matrix hover:text-bg-0 hover:border-matrix hover:shadow-[0_0_20px_rgba(0,255,102,0.25)] ${
                      selected ? 'bg-matrix text-bg-0 border-matrix shadow-[0_0_20px_rgba(0,255,102,0.25)]' : ''
                    }`
                  : `hover:border-matrix/40 hover:text-matrix ${
                      selected ? 'border-matrix/40 text-matrix' : ''
                    }`
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
