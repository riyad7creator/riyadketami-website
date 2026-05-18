'use client';

import { useEffect, useRef } from 'react';

const GLYPHS = 'アイウエオカキクケコ01AIdigitalKETAMI';
const FONT_SIZE = 14;
const COLOR = '#00cd29';

interface MatrixCanvasProps {
  className?: string;
}

export default function MatrixCanvas({ className = '' }: MatrixCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drops: { x: number; y: number; speed: number; chars: string[] }[] = [];
    let raf: number;
    let frame = 0;
    let visible = false;

    const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '0';

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;

      const cols = Math.ceil(parent.clientWidth / FONT_SIZE);
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * FONT_SIZE,
        y: Math.random() * -parent.clientHeight,
        speed: 0.5 + Math.random() * 1.5,
        chars: Array.from({ length: 12 }, randomGlyph),
      }));
    };

    const draw = () => {
      if (!visible) {
        raf = requestAnimationFrame(draw);
        return;
      }

      frame++;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", "Courier New", ui-monospace, monospace`;
      ctx.textBaseline = 'top';

      for (const drop of drops) {
        drop.y += drop.speed;

        if (drop.y > h) {
          drop.y = -FONT_SIZE * (2 + Math.random() * 8);
          drop.speed = 0.5 + Math.random() * 1.5;
        }

        // Swap a random char occasionally
        if (frame % 4 === 0) {
          const idx = Math.floor(Math.random() * drop.chars.length);
          drop.chars[idx] = randomGlyph();
        }

        for (let j = 0; j < drop.chars.length; j++) {
          const cy = drop.y - j * FONT_SIZE;
          if (cy < -FONT_SIZE || cy > h + FONT_SIZE) continue;

          const t = j / (drop.chars.length - 1); // 0 = head, 1 = tail
          const alpha = (1 - t * 0.85) * 0.8;

          if (j === 0) {
            ctx.fillStyle = `rgba(220,255,235,${Math.min(1, alpha + 0.3)})`;
          } else {
            ctx.fillStyle = hexToRgba(COLOR, alpha);
          }

          ctx.fillText(drop.chars[j] ?? '0', drop.x, cy);
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) visible = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity: 0.07 }}
    />
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
