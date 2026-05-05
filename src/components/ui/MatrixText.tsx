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
  const [revealed, setRevealed] = useState(autoPlay ? 0 : text.length);
  const frameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runScramble = () => {
    setRevealed(0);
    let count = 0;
    const step = () => {
      setDisplayed(scramble(text, count));
      if (count < text.length) {
        count++;
        frameRef.current = setTimeout(step, speed);
      } else {
        setDisplayed(text);
      }
    };
    step();
  };

  useEffect(() => {
    if (autoPlay && inView) runScramble();
    return () => { if (frameRef.current) clearTimeout(frameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  useEffect(() => {
    setDisplayed(text);
    setRevealed(text.length);
  }, [text]);

  return (
    <span
      ref={ref}
      className={`font-mono ${className}`}
      onMouseEnter={scrambleOnHover ? runScramble : undefined}
      aria-label={text}
    >
      {displayed}
    </span>
  );
}
