import Eyebrow from '@/components/ui/Eyebrow';
import NewsletterForm from '@/components/newsletter/NewsletterForm';
import type { Dictionary } from '@/lib/dictionaries';
import type { Locale } from '@/i18n/config';

interface NewsletterSectionProps {
  dict: Dictionary;
  locale: Locale;
}

export default function NewsletterSection({ dict, locale }: NewsletterSectionProps) {
  const t = dict.home.newsletter;

  return (
    <section id="newsletter" aria-labelledby="newsletter-title" className="border-t border-line px-4 py-20 sm:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-8 md:grid-cols-2 md:items-end">
        <div className="flex flex-col gap-4">
          <Eyebrow text={t.eyebrow} />
          <h2 id="newsletter-title" className="font-display text-3xl font-bold text-paper sm:text-4xl">
            {t.title}
          </h2>
          <p className="text-base leading-relaxed text-text-1 sm:text-lg">{t.subtitle}</p>
        </div>
        <NewsletterForm dict={dict} locale={locale} variant="inline" source="homepage" />
      </div>
    </section>
  );
}
