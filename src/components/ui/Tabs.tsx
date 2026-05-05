'use client';

import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

export default function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const uid = useId();

  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div className={className}>
      <div role="tablist" className="flex gap-1 border-b border-border pb-0">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`${uid}-tab-${tab.id}`}
              aria-controls={`${uid}-panel-${tab.id}`}
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-fast)] ${
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
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab && (
          <motion.div
            key={active}
            role="tabpanel"
            id={`${uid}-panel-${active}`}
            aria-labelledby={`${uid}-tab-${active}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab.content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
