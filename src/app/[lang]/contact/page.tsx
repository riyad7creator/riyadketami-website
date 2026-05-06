import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/i18n/config';
import { getDictionary } from '@/lib/dictionaries';
import { Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import ContactForm from '@/components/contact/ContactForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};
  const dict = getDictionary(lang);
  return { title: dict.contact.headline };
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
  };

  return (
    <section className="pt-32 pb-24 px-5 sm:px-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <Reveal direction="up">
            <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
          </Reveal>
          <Reveal direction="up" delay={0.08}>
            <h1 className="font-display font-bold text-[clamp(2.5rem,6vw,4rem)] tracking-[-0.02em] text-text-0 leading-[1.05]">
              {t.headline}
            </h1>
          </Reveal>
        </div>

        <Reveal direction="up" delay={0.16}>
          <ContactForm labels={formLabels} />
        </Reveal>
      </div>
    </section>
  );
}
