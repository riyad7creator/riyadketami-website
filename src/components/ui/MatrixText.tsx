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
  const [displayed, setDisplayed] = useState(autoPlay ? scramble(text, 0) : text);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always track the latest text so cleanup can resolve to it
  const textRef = useRef(text);
  useEffect(() => { textRef.current = text; }, [text]);

  const runScramble = (target: string = text) => {
    // Cancel any running animation before starting a new one
    if (frameRef.current) {
      clearTimeout(frameRef.current);
      frameRef.current = null;
    }

    let count = 0;
    const step = () => {
      setDisplayed(scramble(target, count));
      if (count < target.length) {
        count++;
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
