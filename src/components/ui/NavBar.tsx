'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import LangSwitcher from './LangSwitcher';
import type { Locale } from '@/i18n/config';

interface NavItem {
  label: string;
  href: string;
}

interface NavBarProps {
  locale: Locale;
  items: NavItem[];
}

export default function NavBar({ locale, items }: NavBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close menu on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-[var(--z-nav)] transition-all duration-300 ${
          scrolled
            ? 'backdrop-blur-md bg-bg-0/70 border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.04)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          <Link
            href={`/${locale}`}
            className="font-display font-bold text-text-0 hover:text-matrix transition-colors duration-[var(--duration-fast)] tracking-tight"
          >
            RK
            <span className="text-matrix">.</span>
          </Link>

          {/* Desktop */}
          <ul className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-[var(--duration-fast)] ${
                      active ? 'text-matrix' : 'text-text-2 hover:text-text-0'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <LangSwitcher currentLocale={locale} />
            <button
              ref={menuBtnRef}
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text-2 hover:text-text-0 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              {mobileOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-nav"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            aria-label="Mobile navigation"
            className="fixed top-16 inset-x-0 z-[calc(var(--z-nav)-1)] glass border-b border-border px-5 py-4 flex flex-col gap-1 md:hidden"
          >
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-3 min-h-[44px] flex items-center rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-[var(--duration-fast)] ${
                    active ? 'bg-matrix/10 text-matrix' : 'text-text-1 hover:bg-surface hover:text-text-0'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
