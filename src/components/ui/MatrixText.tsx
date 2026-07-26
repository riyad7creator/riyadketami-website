'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&';

interface MatrixTextProps {
  text: string;
  className?: string;
  scrambleOnHover?: boolean;
  autoPlay?: boolean;
  speed?: number;
}

function scramble(text: string, revealedCount: number): string {
  return text
    .split('')
    .map((char, i) => {
      if (char === ' ') return ' ';
      if (i < revealedCount) return char;
      return CHARSET[Math.floor(Math.random() * CHARSET.length)] ?? char;
    })
    .join('');
}

export default function MatrixText({
  text,
  className = '',
  scrambleOnHover = false,
  autoPlay = true,
  speed = 30,
}: MatrixTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  // Initialize with the real text: scramble() uses Math.random(), which would make
  // server and client HTML disagree (hydration mismatch). Scrambling starts on inView.
  const [displayed, setDisplayed] = useState(text);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always track the latest text so cleanup can resolve to it
  const textRef = useRef(text);
  useEffect(() => { textRef.current = text; }, [text]);

  const runScramble = (target: string = text) => {
    // Vestibular safety: no scramble for reduced-motion users
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(target);
      return;
    }

    // Cancel any running animation before starting a new one
    if (frameRef.current) {
      clearTimeout(frameRef.current);
      frameRef.current = null;
    }

    // Resolve multiple chars per tick on long strings so total time caps at ~750ms
    const charsPerTick = Math.max(1, Math.ceil(target.length / 25));
    let count = 0;
    const step = () => {
      setDisplayed(scramble(target, count));
      if (count < target.length) {
        count += charsPerTick;
        frameRef.current = setTimeout(step, speed);
      } else {
        // Hard resolve — always land on the real text
        setDisplayed(target);
        frameRef.current = null;
      }
    };
    step();
  };

  // Trigger on scroll-into-view
  useEffect(() => {
    if (autoPlay && inView) runScramble(text);

    return () => {
      if (frameRef.current) {
        clearTimeout(frameRef.current);
        frameRef.current = null;
      }
      // Hard fallback: never leave garbled characters on unmount / re-trigger
      setDisplayed(textRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  // Sync immediately when the text prop changes
  useEffect(() => {
    textRef.current = text;
    setDisplayed(text);
  }, [text]);

  return (
    <span
      ref={ref}
      className={`font-mono ${className}`}
      onMouseEnter={scrambleOnHover ? () => runScramble(text) : undefined}
      aria-label={text}
    >
      {displayed}
    </span>
  );
}
