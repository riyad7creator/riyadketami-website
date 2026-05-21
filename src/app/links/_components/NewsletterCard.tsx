'use client';

import { Mail } from 'lucide-react';
import MatrixText from '@/components/ui/MatrixText';
import NewsletterForm from '@/components/newsletter/NewsletterForm';
import type { Dictionary } from '@/lib/dictionaries';
import type { Locale } from '@/i18n/config';

export default function NewsletterCard({
  subscriberCount,
  dict,
  locale = 'en',
}: {
  subscriberCount: number;
  dict: Dictionary;
  locale?: Locale;
}) {
  const countLabel =
    subscriberCount >= 1000
      ? `${Math.floor(subscriberCount / 1000)}K+`
      : `${subscriberCount}+`;

  return (
    <section
      id="newsletter"
      className="w-full glass rounded-[var(--radius-lg)] p-5 flex flex-col gap-4"
      aria-label="Newsletter signup"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-matrix/10 border border-matrix/20 flex items-center justify-center shrink-0">
          <Mail size={14} className="text-matrix" />
        </div>
        <div className="flex flex-col gap-0.5">
          <MatrixText
            text="// weekly insights"
            className="text-[9px] tracking-[0.18em] text-matrix"
          />
          <p className="font-display font-semibold text-text-0 text-sm mt-0.5 leading-tight">
            AI &amp; business insights, every week.
          </p>
          <p className="text-xs text-text-2 -mt-0.5">
            Free. Join {countLabel} readers. Unsubscribe anytime.
          </p>
        </div>
      </div>

      <NewsletterForm dict={dict} locale={locale} variant="stacked" />
    </section>
  );
}
