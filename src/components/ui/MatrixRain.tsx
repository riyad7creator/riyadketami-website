'use client';

import { useEffect, useRef } from 'react';

const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF$#@';

interface MatrixRainProps {
  className?: string;
  opacity?: number;
  speed?: number;
  density?: number;
}

interface Drop {
  x: number;
  y: number;        // head Y in pixels
  speed: number;
  trailLen: number; // number of cells in trail
  glyphs: string[];
  nextSwap: number; // frame count for next glyph swap
  alpha: number;    // per-drop brightness multiplier
}

export default function MatrixRain({
  className = '',
  opacity = 0.15,
  speed = 1,
  density = 1,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect user's motion preference — skip animation entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const FONT_SIZE = 15;
    const TRAIL_MIN = 6;
    const TRAIL_MAX = 28;

    // Read the rain green from tokens so canvas colors can't drift from CSS
    const rainRgb =
      getComputedStyle(document.documentElement).getPropertyValue('--matrix-rain-rgb').trim() ||
      '0, 255, 65';

    let drops: Drop[] = [];
    let raf = 0;
    let frame = 0;
    let running = false;
    let intersecting = true;

    const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '0';

    const newDrop = (canvasW: number, canvasH: number, startAtRandom?: boolean): Drop => {
      const trailLen = TRAIL_MIN + Math.floor(Math.random() * (TRAIL_MAX - TRAIL_MIN));
      return {
        x: Math.random() * (canvasW - FONT_SIZE),
        y: startAtRandom
          ? -Math.random() * canvasH * 1.5          // spread stagger on init
          : -(trailLen * FONT_SIZE) - Math.random() * 120, // just off-screen top
        speed: (0.35 + Math.random() * 1.1) * speed,
        trailLen,
        glyphs: Array.from({ length: trailLen }, randomGlyph),
        nextSwap: Math.floor(Math.random() * 12),
        alpha: 0.4 + Math.random() * 0.6,
      };
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count = Math.max(8, Math.floor((canvas.width / FONT_SIZE) * density * 0.55));
      drops = Array.from({ length: count }, () => newDrop(canvas.width, canvas.height, true));
    };

    // Run only while the tab is visible AND the canvas intersects the viewport.
    // The `running` flag guarantees a single rAF loop no matter how the two
    // signals interleave.
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const start = () => {
      if (running || document.hidden || !intersecting) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const io = new IntersectionObserver(([entry]) => {
      intersecting = entry?.isIntersecting ?? true;
      if (intersecting) start();
      else stop();
    });
    io.observe(canvas);

    const draw = () => {
      frame++;
      const W = canvas.width;
      const H = canvas.height;

      // Full clear every frame — trails are drawn explicitly per drop
      ctx.clearRect(0, 0, W, H);

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = 'top';

      for (const drop of drops) {
        // Advance drop
        drop.y += drop.speed;

        // Swap a random glyph in the trail for animation
        if (frame >= drop.nextSwap) {
          const idx = Math.floor(Math.random() * drop.glyphs.length);
          drop.glyphs[idx] = randomGlyph();
          drop.nextSwap = frame + 4 + Math.floor(Math.random() * 8);
        }

        // Draw trail from tail → head (tail dim, head bright)
        for (let j = drop.trailLen - 1; j >= 0; j--) {
          const cy = drop.y - j * FONT_SIZE;
          if (cy < -FONT_SIZE || cy > H + FONT_SIZE) continue;

          // j=0 is head (brightest), j=trailLen-1 is tail (dimmest)
          const t = j / (drop.trailLen - 1); // 0=head, 1=tail
          const cellAlpha = drop.alpha * opacity * (1 - t * 0.88);

          if (j === 0) {
            // Head: near-white hot
            ctx.fillStyle = `rgba(220,255,235,${Math.min(1, cellAlpha * 5)})`;
          } else if (j <= 2) {
            // Near-head: rain green, bright
            ctx.fillStyle = `rgba(${rainRgb},${Math.min(1, cellAlpha * 2.5)})`;
          } else {
            // Body: rain green, fading
            ctx.fillStyle = `rgba(${rainRgb},${Math.max(0, cellAlpha * 0.78)})`;
          }

          ctx.fillText(drop.glyphs[drop.trailLen - 1 - j] ?? '0', drop.x, cy);
        }

        // Reset when entire trail is off-screen bottom
        if (drop.y - drop.trailLen * FONT_SIZE > H) {
          Object.assign(drop, newDrop(W, H, false));
        }
      }

      if (running) raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [opacity, speed, density]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden
    />
  );
}
