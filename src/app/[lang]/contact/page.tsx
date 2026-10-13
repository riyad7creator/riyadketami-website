import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { localizedAlternates } from '@/lib/seo';
import Eyebrow from '@/components/ui/Eyebrow';
import SocialRow from '@/components/ui/SocialRow';
import { BRAND } from '@/lib/brand';
import ContactForm from '@/components/contact/ContactForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.contact.eyebrow,
    description: dict.meta.contact_description,
    alternates: localizedAlternates(lang, 'contact'),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.contact;

  const formLabels = {
    name: t.fields.name,
    email: t.fields.email,
    subject: t.fields.subject,
    message: t.fields.message,
    budget: t.fields.budget,
    submit: t.submit,
    success: t.success,
    error: t.error,
    placeholders: t.placeholders,
    validation: t.validation,
  };

  return (
    <section className="px-4 pb-24 pt-32 sm:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-bold leading-[1.05] text-paper">
            {t.headline}
          </h1>
          {/* Brief §2.3 Contact: address shown as selectable text */}
          <div className="flex flex-col gap-2 pt-2">
            <Eyebrow>{t.email_eyebrow}</Eyebrow>
            <a
              href={BRAND.mailto}
              className="w-fit select-text font-mono text-lg text-paper underline decoration-signal underline-offset-[6px] hover:text-signal"
            >
              {BRAND.email}
            </a>
            <p className="text-sm text-muted">{t.email_response}</p>
          </div>
          <p className="text-muted">{t.location}</p>
          <SocialRow className="-ms-2" />
        </div>

        <ContactForm labels={formLabels} />
      </div>
    </section>
  );
}
