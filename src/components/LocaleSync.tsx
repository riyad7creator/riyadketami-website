'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function LocaleSync() {
  const pathname = usePathname();

  useEffect(() => {
    const locale = pathname.split('/')[1] ?? 'en';
    const dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [pathname]);

  return null;
}
