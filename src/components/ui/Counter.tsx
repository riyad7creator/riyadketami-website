'use client';

import { useRef, useEffect, useState } from 'react';
import { useInView } from 'framer-motion';
import NumberFlow from '@number-flow/react';

interface CounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

/**
 * NumberFlow handles the per-digit roll, locale formatting, tabular figures,
 * and prefers-reduced-motion. We only own the scroll trigger: the value stays
 * at 0 until the element enters the viewport, then flows to the real number.
 */
export default function Counter({
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (inView) setDisplayValue(value);
  }, [inView, value]);

  return (
    <span ref={ref} className={className}>
      <NumberFlow
        value={displayValue}
        prefix={prefix}
        suffix={suffix}
        format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }}
      />
    </span>
  );
}
