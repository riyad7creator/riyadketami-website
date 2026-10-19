import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, type Locale } from '@/i18n/config';
import { getSiteDictionary } from '@/lib/site-content';
import Eyebrow from '@/components/ui/Eyebrow';
import { RequestLinkForm, ManageForm } from '@/components/newsletter/PreferencesForms';
import { verifyUnsubToken } from '@/lib/newsletter-tokens';
import dbConnect from '@/lib/db/connect';
import Subscriber from '@/models/Subscriber';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PreferencesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const { e, t: token } = await searchParams;
  const dict = await getSiteDictionary(lang);
  const t = dict.newsletter.preferences;

  let manage: { email: string; token: string; lang: Locale; subscribed: boolean } | null = null;
  let invalid = false;
  if (typeof e === 'string' && typeof token === 'string') {
    const email = e.toLowerCase().trim();
    if (email.length < 255 && verifyUnsubToken(email, token)) {
      await dbConnect();
      const sub = await Subscriber.findOne({ email }).select('preferredLanguage unsubscribed confirmed').lean();
      if (sub && sub.confirmed !== false) {
        manage = { email, token, lang: (sub.preferredLanguage ?? lang) as Locale, subscribed: !sub.unsubscribed };
      } else invalid = true;
    } else invalid = true;
  }

  return (
    <section className="px-4 pb-24 pt-32 sm:px-8">
      <div className="mx-auto flex max-w-[560px] flex-col gap-5">
        <Eyebrow text={dict.home.newsletter.eyebrow} />
        <h1 className="font-display text-3xl font-bold text-paper sm:text-4xl">{t.title}</h1>
        {invalid && <p className="text-sm text-warning">{t.invalid}</p>}
        {manage ? (
          <ManageForm
            email={manage.email}
            token={manage.token}
            initialLang={manage.lang}
            initialSubscribed={manage.subscribed}
            t={t}
            languageNames={dict.home.newsletter.language_options}
          />
        ) : (
          <RequestLinkForm lang={lang} t={t} />
        )}
      </div>
    </section>
  );
}
