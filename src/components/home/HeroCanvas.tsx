'use client';

import { useEffect, useRef, useState } from 'react';

// Matrix Rain — DZ Edition (brand book 08 / M3): Arabic letterforms, not Katakana.
const GLYPHS = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي٠١٢٣٤٥٦٧٨٩0123456789#$@%&';

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  glyph: string;
  swapAt: number;
  flickerAt: number;
  releaseAt: number;
  settled: boolean;
  alpha: number;
  brightness: number;
}

interface HeroCanvasProps {
  src: string;
  className?: string;
  /** When true, the rAF loop is suspended (e.g. while the layer is fully transparent). */
  paused?: boolean;
}

const SAMPLE = 96;
const STEP = 2;
const LUM_THRESHOLD = 55;
const MAX_PARTICLES = 2200;
const FONT_SIZE = 14;

function pickGlyph(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '0';
}

export default function HeroCanvas({ src, className = '', paused = false }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const pausedRef = useRef(paused);
  const controlsRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  // Toggle the loop without re-running the main effect (which would reload the image)
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) controlsRef.current?.stop();
    else controlsRef.current?.start();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Read tokens once so canvas colors stay in sync with design tokens
    const root = getComputedStyle(document.documentElement);
    const bg0 = root.getPropertyValue('--bg-0').trim() || '#111111';
    const rainRgb = root.getPropertyValue('--matrix-rain-rgb').trim() || '0, 205, 41';

    let particles: Particle[] = [];
    let raf = 0;
    let started = 0;
    let lastT = 0;
    let running = false;
    let loaded = false;
    let intersecting = true;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const computeParticles = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const size = Math.min(w, h);
      const offsetX = (w - size) / 2;
      const offsetY = (h - size) / 2;

      const tmp = document.createElement('canvas');
      tmp.width = SAMPLE;
      tmp.height = SAMPLE;
      const tctx = tmp.getContext('2d', { willReadFrequently: true });
      if (!tctx) return [];
      tctx.fillStyle = '#000';
      tctx.fillRect(0, 0, SAMPLE, SAMPLE);
      tctx.drawImage(image, 0, 0, SAMPLE, SAMPLE);
      const data = tctx.getImageData(0, 0, SAMPLE, SAMPLE).data;

      const cellSize = size / SAMPLE;
      const out: Particle[] = [];

      for (let gy = 0; gy < SAMPLE; gy += STEP) {
        for (let gx = 0; gx < SAMPLE; gx += STEP) {
          const i = (gy * SAMPLE + gx) * 4;
          const r = data[i] ?? 0;
          const g = data[i + 1] ?? 0;
          const b = data[i + 2] ?? 0;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum < LUM_THRESHOLD) continue;
          // Exclude matrix-green background pixels (G dominant) — keeps face/skin only
          if (g > r + 25 && g > b + 25) continue;

          const tx = offsetX + gx * cellSize + cellSize * 0.5;
          const ty = offsetY + gy * cellSize + cellSize * 0.5;

          const startSide = Math.random();
          let sx: number, sy: number;
          if (startSide < 0.7) {
            sx = Math.random() * w;
            sy = -Math.random() * h * 0.6 - 40;
          } else if (startSide < 0.85) {
            sx = -40;
            sy = Math.random() * h;
          } else {
            sx = w + 40;
            sy = Math.random() * h;
          }

          const brightness = Math.min(1, lum / 220);

          out.push({
            x: sx,
            y: sy,
            tx,
            ty,
            vx: 0,
            vy: 0,
            glyph: pickGlyph(),
            swapAt: Math.random() * 200,
            flickerAt: 0,
            releaseAt: Math.random() * 800,
            settled: reduced,
            alpha: 0,
            brightness: 0.55 + brightness * 0.45,
          });

          if (out.length >= MAX_PARTICLES) return out;
        }
      }
      return out;
    };

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT_SIZE}px "IBM Plex Sans Arabic", "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      if (image.complete && image.naturalWidth > 0) {
        particles = computeParticles();
        if (reduced) {
          for (const p of particles) {
            p.x = p.tx;
            p.y = p.ty;
            p.alpha = 1;
            p.settled = true;
          }
        }
      }
    };

    const STIFFNESS = 0.08;
    const DAMPING = 0.76;
    const SETTLE_THRESHOLD = 0.4;

    // Quantized fillStyle cache: 16 alpha buckets × 2 modes (head, settled).
    // Settled glyphs use the rain green from tokens (--matrix-rain-rgb).
    const ALPHA_BUCKETS = 16;
    const headStyles: string[] = [];
    const settledStyles: string[] = [];
    for (let i = 0; i < ALPHA_BUCKETS; i++) {
      const a = (i + 1) / ALPHA_BUCKETS;
      headStyles.push(`rgba(200,255,220,${a.toFixed(3)})`);
      settledStyles.push(`rgba(${rainRgb},${(a * 0.75).toFixed(3)})`);
    }

    const draw = (t: number) => {
      if (!started) started = t;
      // Compensate for long gaps (loop was paused) so scheduling doesn't jump
      if (lastT && t - lastT > 250) started += t - lastT - 16;
      lastT = t;
      const elapsed = t - started;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.fillStyle = bg0;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        if (elapsed < p.releaseAt) continue;
        if (p.alpha < 1) p.alpha = Math.min(1, p.alpha + 0.04);

        if (!p.settled) {
          const ax = (p.tx - p.x) * STIFFNESS;
          const ay = (p.ty - p.y) * STIFFNESS;
          p.vx = (p.vx + ax) * DAMPING;
          p.vy = (p.vy + ay) * DAMPING;
          p.x += p.vx;
          p.y += p.vy;

          if (
            Math.abs(p.tx - p.x) < SETTLE_THRESHOLD &&
            Math.abs(p.ty - p.y) < SETTLE_THRESHOLD &&
            Math.abs(p.vx) < 0.05 &&
            Math.abs(p.vy) < 0.05
          ) {
            p.settled = true;
            p.x = p.tx;
            p.y = p.ty;
            p.flickerAt = elapsed + 4000 + Math.random() * 8000;
          }

          if (elapsed > p.swapAt) {
            p.glyph = pickGlyph();
            p.swapAt = elapsed + 60 + Math.random() * 80;
          }
        } else if (elapsed > p.flickerAt) {
          p.glyph = pickGlyph();
          p.flickerAt = elapsed + 4000 + Math.random() * 8000;
        }

        const baseAlpha = p.alpha * p.brightness;
        const bucket = Math.min(ALPHA_BUCKETS - 1, Math.floor(baseAlpha * ALPHA_BUCKETS));
        ctx.fillStyle = p.settled ? settledStyles[bucket]! : headStyles[bucket]!;
        ctx.fillText(p.glyph, p.x, p.y);
      }

      if (running) raf = requestAnimationFrame(draw);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const start = () => {
      if (running || !loaded || pausedRef.current || !intersecting || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(draw);
    };
    controlsRef.current = { start, stop };

    const io = new IntersectionObserver(([entry]) => {
      intersecting = entry?.isIntersecting ?? true;
      if (intersecting) start();
      else stop();
    });
    io.observe(canvas);

    const image = new Image();
    image.crossOrigin = 'anonymous';
    let cancelled = false;

    const startAnim = () => {
      if (cancelled) return;
      // Defer to next frame so the canvas has been laid out before measuring clientWidth
      requestAnimationFrame(() => {
        if (cancelled) return;
        resize();
        setReady(true);
        loaded = true;
        stop();
        start();
      });
    };

    image.onload = startAnim;
    image.onerror = () => {
      console.error(`[HeroCanvas] failed to load ${src}`);
    };
    image.src = src;
    if (image.complete && image.naturalWidth > 0) {
      startAnim();
    }

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);

    return () => {
      cancelled = true;
      stop();
      controlsRef.current = null;
      ro.disconnect();
      io.disconnect();
    };
  }, [src]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />
      <span className="sr-only">Portrait of Riyad Ketami rendered in matrix glyphs</span>
      {!ready && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <span className="font-mono text-xs text-text-2 tracking-[0.2em]">
            // initializing
          </span>
        </div>
      )}
    </div>
  );
}
