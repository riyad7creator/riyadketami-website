'use client';

import { useEffect, useRef } from 'react';

const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

interface MatrixRainProps {
  className?: string;
  opacity?: number;
  speed?: number;
  density?: number;
}

export default function MatrixRain({
  className = '',
  opacity = 0.15,
  speed = 1,
  density = 1,
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const FONT_SIZE = 14;
    let cols: number[] = [];
    let raf: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count = Math.floor((canvas.width / FONT_SIZE) * density);
      cols = Array.from({ length: count }, () => Math.random() * -(canvas.height / FONT_SIZE));
    };

    const draw = () => {
      ctx.fillStyle = `rgba(10, 11, 13, 0.05)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;

      cols.forEach((y, i) => {
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '0';
        const x = (i / density) * FONT_SIZE;

        const isHead = y * FONT_SIZE > canvas.height * 0.8;
        ctx.fillStyle = isHead ? `rgba(200, 255, 220, ${opacity})` : `rgba(0, 255, 102, ${opacity})`;
        ctx.fillText(glyph, x, y * FONT_SIZE);

        if (y * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          cols[i] = 0;
        } else {
          cols[i] = (cols[i] ?? 0) + speed;
        }
      });

      raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
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
