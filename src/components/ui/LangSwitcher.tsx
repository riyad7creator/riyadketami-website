'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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

/**
 * Radix supplies focus management, typeahead, Esc, arrow keys, and
 * dismiss-on-outside-click. The menu springs out of its trigger corner via
 * Radix's own transform-origin variable, so it reads as emanating, not fading in.
 */
export default function LangSwitcher({ currentLocale }: LangSwitcherProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const dir = currentLocale === 'ar' ? 'rtl' : 'ltr';

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
    <DropdownMenu.Root open={open} onOpenChange={setOpen} dir={dir}>
      <DropdownMenu.Trigger
        aria-label="Switch language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-mono font-medium text-text-2 hover:text-text-0 hover:bg-surface transition-colors duration-[var(--duration-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {labels[currentLocale]}
        <span className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
          <ChevronDown size={12} />
        </span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
            <DropdownMenu.Content asChild align="end" sideOffset={4}>
              <div
                className="anim-pop z-[var(--z-overlay)] glass border border-border rounded-[var(--radius-md)] py-1 min-w-[120px] shadow-xl"
              >
                {locales.map((locale) => (
                  <DropdownMenu.Item
                    key={locale}
                    onSelect={() => switchTo(locale)}
                    className={`w-full px-3 py-2 text-sm text-start cursor-pointer transition-colors duration-[var(--duration-fast)] outline-none data-[highlighted]:bg-surface ${
                      locale === currentLocale ? 'text-matrix font-medium' : 'text-text-1'
                    }`}
                  >
                    {fullLabels[locale]}
                  </DropdownMenu.Item>
                ))}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
