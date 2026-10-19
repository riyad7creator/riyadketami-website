import { BRAND } from '@/lib/brand';
import { FROM_EMAIL } from '@/lib/resend';
import dbConnect from '@/lib/db/connect';
import { getSetting, setSetting } from '@/models/SiteSettings';

export const NL_LANGS = ['en', 'fr', 'ar'] as const;
export type NlLang = (typeof NL_LANGS)[number];

export function isNlLang(v: unknown): v is NlLang {
  return typeof v === 'string' && (NL_LANGS as readonly string[]).includes(v);
}

/** Public origin used in email links (localhost in dev, ketami.net in production) */
export const APP_URL = (process.env.NEXTAUTH_URL || BRAND.url || 'https://ketami.net').replace(/\/+$/, '');

/**
 * Sender for newsletters and the welcome series. Use a dedicated subdomain
 * (news.ketami.net) verified in Resend so newsletter reputation stays apart
 * from personal mail. Falls back to FROM_EMAIL.
 */
export function newsletterFrom(): string {
  const raw = process.env.NEWSLETTER_FROM_EMAIL || FROM_EMAIL;
  return raw.includes('<') ? raw : `Riyad Ketami <${raw}>`;
}

/** Version of the consent wording shown next to the form; bump when it changes */
export const CONSENT_TEXT_VERSION = '2026-10-19';

export interface LeadMagnet {
  title: string;
  url: string;
}

export interface NewsletterSettings {
  /** Postal address printed in every email footer (CAN-SPAM). Use a business address or PO box. */
  postalAddress: string;
  /** Where replies go */
  replyTo: string;
  /** Optional free resource offered on /subscribe and in the first welcome email */
  leadMagnet: Partial<Record<NlLang, LeadMagnet>>;
  /** New campaigns are listed in the public archive unless unticked */
  archiveByDefault: boolean;
}

export const DEFAULT_SETTINGS: NewsletterSettings = {
  postalAddress: '',
  replyTo: process.env.NEWSLETTER_REPLY_TO || BRAND.email || 'riyad@ketami.net',
  leadMagnet: {},
  archiveByDefault: true,
};

const SETTINGS_KEY = 'newsletter_settings';

export async function getNewsletterSettings(): Promise<NewsletterSettings> {
  try {
    await dbConnect();
    const saved = await getSetting<Partial<NewsletterSettings>>(SETTINGS_KEY);
    return {
      ...DEFAULT_SETTINGS,
      ...(saved ?? {}),
      postalAddress: saved?.postalAddress || process.env.NEWSLETTER_POSTAL_ADDRESS || '',
      leadMagnet: { ...(saved?.leadMagnet ?? {}) },
    };
  } catch {
    return { ...DEFAULT_SETTINGS, postalAddress: process.env.NEWSLETTER_POSTAL_ADDRESS || '' };
  }
}

export async function saveNewsletterSettings(value: NewsletterSettings): Promise<void> {
  await dbConnect();
  await setSetting(SETTINGS_KEY, value);
}

export function manageUrl(lang: NlLang, email: string, token: string): string {
  return `${APP_URL}/${lang}/newsletter/preferences?e=${encodeURIComponent(email)}&t=${token}`;
}

export function unsubscribeUrl(email: string, token: string): string {
  return `${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}
