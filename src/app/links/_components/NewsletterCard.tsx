'use client';

import Eyebrow from '@/components/ui/Eyebrow';
import NewsletterForm from '@/components/newsletter/NewsletterForm';
import type { Dictionary } from '@/lib/dictionaries';
import type { Locale } from '@/i18n/config';

// Never cites a reader count (brief §2.1).
export default function NewsletterCard({ dict, locale = 'en' }: { dict: Dictionary; locale?: Locale }) {
  return (
    <section
      id="newsletter"
      className="w-full rounded-[var(--radius-md)] border border-line bg-panel p-5 flex flex-col gap-4"
      aria-label="Newsletter signup"
    >
      <div className="flex flex-col gap-2">
        <Eyebrow text={dict.home.newsletter.eyebrow} />
        <p className="font-display text-base font-bold text-paper">{dict.home.newsletter.title}</p>
      </div>

      <NewsletterForm dict={dict} locale={locale} variant="stacked" source="links-page" />
    </section>
  );
}
