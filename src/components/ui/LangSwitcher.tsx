'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { locales } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

const labels: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  ar: 'ع',
};

const fullLabels: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
};

interface LangSwitcherProps {
  currentLocale: Locale;
}

export default function LangSwitcher({ currentLocale }: LangSwitcherProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const switchTo = (locale: Locale) => {
    setOpen(false);
    if (locale === currentLocale) return;
    const segments = pathname.split('/');
    segments[1] = locale;
    // Full navigation so the server re-renders <html lang> and <html dir>,
    // which control Arabic fonts (`:lang(ar)`) and RTL (`[dir="rtl"]`).
    window.location.href = segments.join('/') || '/';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono font-medium text-text-2 hover:text-text-0 hover:bg-surface transition-colors duration-[var(--duration-fast)]"
        aria-label="Switch language"
        aria-expanded={open}
      >
        {labels[currentLocale]}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={12} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute end-0 top-full mt-1 z-20 glass border border-border rounded-[var(--radius-md)] py-1 min-w-[120px] shadow-xl"
            >
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => switchTo(locale)}
                  className={`w-full px-3 py-2 text-sm text-start transition-colors duration-[var(--duration-fast)] hover:bg-surface ${
                    locale === currentLocale ? 'text-matrix font-medium' : 'text-text-1'
                  }`}
                >
                  {fullLabels[locale]}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
