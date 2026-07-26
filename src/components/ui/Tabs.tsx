'use client';

import { useState, useId } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  /** Passed to Radix so arrow-key direction matches the writing direction. */
  dir?: 'ltr' | 'rtl';
  className?: string;
}

/**
 * Radix supplies the WAI-ARIA tabs pattern (roving tabindex, arrow keys,
 * Home/End). Framer Motion supplies the sliding indicator and the enter-only
 * panel swap — no exit choreography, so content appears on frame 1.
 */
export default function Tabs({ tabs, defaultTab, dir = 'ltr', className = '' }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const uid = useId();

  return (
    <RadixTabs.Root value={active} onValueChange={setActive} dir={dir} className={className}>
      <RadixTabs.List className="flex gap-1 border-b border-border pb-0">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <RadixTabs.Trigger
              key={tab.id}
              value={tab.id}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                isActive ? 'text-text-0' : 'text-text-2 hover:text-text-1'
              }`}
            >
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId={`${uid}-indicator`}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-matrix"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>

      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.id} value={tab.id} className="focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab.content}
          </motion.div>
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
