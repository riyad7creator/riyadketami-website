'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Code2,
  Brain,
  FileText,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

interface SkillItem {
  name: string;
  description: string;
  icon: string;
}

interface SkillsGridProps {
  skills: SkillItem[];
}

const iconMap: Record<string, LucideIcon> = {
  lightbulb: Lightbulb,
  code: Code2,
  brain: Brain,
  'file-text': FileText,
  'trending-up': TrendingUp,
  users: Users,
};

export default function SkillsGrid({ skills }: SkillsGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
      {skills.map((skill, i) => {
        const Icon = iconMap[skill.icon] ?? Lightbulb;
        const isOpen = openIndex === i;

        return (
          <motion.button
            key={i}
            onClick={() => setOpenIndex(isOpen ? null : i)}
            layout
            className={`text-left flex flex-col gap-3 glass rounded-[var(--radius-md)] px-5 py-4 border transition-colors duration-[var(--duration-fast)] cursor-pointer select-none ${
              isOpen
                ? 'border-matrix/40 bg-matrix/[0.04]'
                : 'border-border hover:border-border-hover'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`transition-colors duration-[var(--duration-fast)] ${
                  isOpen ? 'text-matrix' : 'text-text-2'
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
              </span>
              <span
                className={`text-sm font-medium transition-colors duration-[var(--duration-fast)] ${
                  isOpen ? 'text-text-0' : 'text-text-1'
                }`}
              >
                {skill.name}
              </span>
            </div>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <p className="text-text-2 text-sm leading-relaxed pr-2">
                    {skill.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
