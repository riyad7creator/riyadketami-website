'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Button from './Button';
import Pill from './Pill';

interface PricingTierProps {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  cta?: string;
  onSelect?: () => void;
  featured?: boolean;
  className?: string;
}

export default function PricingTier({
  name,
  price,
  period,
  description,
  features,
  cta = 'Get started',
  onSelect,
  featured = false,
  className = '',
}: PricingTierProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex flex-col gap-6 rounded-[var(--radius-lg)] p-7 border ${
        featured
          ? 'bg-matrix/5 border-matrix/40 shadow-[0_0_40px_rgba(var(--matrix-rgb),0.12)]'
          : 'glass border-border'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-text-0 text-lg">{name}</span>
          {description && <span className="text-text-2 text-sm">{description}</span>}
        </div>
        {featured && <Pill variant="matrix">Popular</Pill>}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold font-display text-text-0">{price}</span>
        {period && <span className="text-text-2 text-sm">/{period}</span>}
      </div>

      <ul className="flex flex-col gap-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-text-1">
            <Check size={14} className="text-matrix shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <Button
        variant={featured ? 'primary' : 'secondary'}
        className="w-full mt-auto"
        onClick={onSelect}
       
      >
        {cta}
      </Button>
    </motion.div>
  );
}
