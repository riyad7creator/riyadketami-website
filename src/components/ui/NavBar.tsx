'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import LangSwitcher from './LangSwitcher';
import Wordmark from './Wordmark';
import { BRAND } from '@/lib/brand';
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
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close menu on navigation — adjusted during render rather than in an
  // effect, so the closed state lands in the same commit as the new route.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
  }

  // Escape to close + Tab focus trap + inert background while open
  useEffect(() => {
    if (!mobileOpen) return;

    // Disable interaction with the rest of the page while drawer is open
    const main = document.querySelector('main');
    main?.setAttribute('inert', '');

    // Move focus to the first link in the drawer after open animation
    const focusTimer = window.setTimeout(() => {
      const firstLink = drawerRef.current?.querySelector<HTMLElement>('a, button');
      firstLink?.focus();
    }, 50);

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        menuBtnRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;

      // Focus trap inside header + drawer
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = Array.from(
        drawer.querySelectorAll<HTMLElement>('a, button, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.hasAttribute('disabled'));
      const all = [menuBtnRef.current, ...focusables].filter(Boolean) as HTMLElement[];
      if (all.length === 0) return;

      const first = all[0]!;
      const last = all[all.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      window.clearTimeout(focusTimer);
      main?.removeAttribute('inert');
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-[var(--z-nav)] transition-[background-color,border-color] duration-200 ${
          scrolled
            ? 'bg-ink border-b border-line'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          {/* Wordmark RIYAD KETAMI_ with the signal cursor (brief §3.3, §4) */}
          <Link
            href={`/${locale}`}
            aria-label={`${BRAND.name}, home`}
            className="inline-flex min-h-[44px] items-center text-paper text-base"
          >
            <Wordmark />
          </Link>

          {/* Desktop — the active pill slides between items on navigation */}
          <ul className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.href} className="relative">
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      className="absolute inset-x-3 bottom-1 h-px bg-signal"
                      aria-hidden
                    />
                  )}
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex min-h-[44px] items-center px-3 text-sm font-medium transition-colors duration-[var(--duration-fast)] ${
                      active ? 'text-paper' : 'text-muted hover:text-paper'
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

      {/* Mobile drawer — flat panel, no blur or heavy shadow (brief §3.4) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-nav"
            ref={drawerRef}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.15, ease: 'easeIn' } }}
            /* Mirrors --ease-spring in tokens.css — slight overshoot so the
               drawer pops in rather than merely sliding. */
            transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
            aria-label="Mobile navigation"
            className="fixed top-[4.5rem] inset-x-3 z-[calc(var(--z-nav)-1)] bg-panel border border-line rounded-[var(--radius-md)] px-3 py-3 flex flex-col gap-1 md:hidden"
          >
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-4 py-3 min-h-[44px] flex items-center rounded-[var(--radius-md)] text-sm font-medium transition-colors duration-[var(--duration-fast)] ${
                    active ? 'text-paper border-s-2 border-signal' : 'text-text-1 hover:bg-surface hover:text-paper'
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
