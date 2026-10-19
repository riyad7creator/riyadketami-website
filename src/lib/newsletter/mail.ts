/**
 * One-to-one newsletter emails sent through Resend's transactional API:
 * confirmation, welcome series, win-back, preference link and test sends.
 * Campaigns themselves go out as Broadcasts (esp.ts).
 */
import { getResend } from '@/lib/resend';
import { BRAND } from '@/lib/brand';
import { unsubToken, confirmToken } from '@/lib/newsletter-tokens';
import { renderEmail, htmlToText, type EmailLang, type EmailFooter } from './template';
import { copyFor } from './copy';
import {
  APP_URL, newsletterFrom, getNewsletterSettings, manageUrl, unsubscribeUrl, isNlLang,
  type NewsletterSettings,
} from './config';

export type MailKind = 'confirm' | 'welcome-1' | 'welcome-2' | 'welcome-3' | 'winback' | 'manage' | 'test';

export function langOf(v: unknown): EmailLang {
  return isNlLang(v) ? v : 'en';
}

export function footerFor(lang: EmailLang, email: string, settings: NewsletterSettings): EmailFooter {
  const c = copyFor(lang);
  const token = unsubToken(email);
  return {
    reason: c.footer.reason,
    unsubscribeLabel: c.footer.unsubscribe,
    unsubscribeUrl: unsubscribeUrl(email, token),
    manageLabel: c.footer.manage,
    manageUrl: manageUrl(lang, email, token),
    postalAddress: settings.postalAddress || undefined,
  };
}

async function deliver(o: {
  to: string;
  subject: string;
  html: string;
  kind: MailKind;
  /** Marketing mail carries RFC 8058 one-click unsubscribe headers */
  marketing: boolean;
  replyTo?: string;
}): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: 'RESEND_API_KEY is not configured' };
  const unsub = unsubscribeUrl(o.to, unsubToken(o.to));
  try {
    const res = await resend.emails.send({
      from: newsletterFrom(),
      to: o.to,
      subject: o.subject,
      html: o.html,
      text: htmlToText(o.html),
      ...(o.replyTo ? { replyTo: o.replyTo } : {}),
      ...(o.marketing
        ? { headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } }
        : {}),
      tags: [{ name: 'category', value: o.kind.replace(/[^a-zA-Z0-9_-]/g, '_') }],
    });
    if (res.error) return { ok: false, error: res.error.message };
    return { ok: true, id: res.data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Send failed' };
  }
}

export async function sendConfirmEmail(email: string, lang: EmailLang) {
  const settings = await getNewsletterSettings();
  const c = copyFor(lang);
  const url = `${APP_URL}/${lang}/newsletter/confirm?e=${encodeURIComponent(email)}&t=${confirmToken(email)}`;
  const html = renderEmail({
    lang,
    subject: c.confirm.subject,
    preheader: c.confirm.preheader,
    heading: c.confirm.heading,
    bodyHtml: c.confirm.body,
    cta: { label: c.confirm.cta!, url },
    afterCtaHtml: c.confirm.note,
    footer: footerFor(lang, email, settings),
    siteUrl: `${APP_URL}/${lang}`,
  });
  return deliver({ to: email, subject: c.confirm.subject, html, kind: 'confirm', marketing: false, replyTo: settings.replyTo });
}

function fillLinks(body: string, lang: EmailLang): string {
  return body
    .replaceAll('{blogUrl}', `${APP_URL}/${lang}/blog`)
    .replaceAll('{videosUrl}', BRAND.youtubeUrl || 'https://www.youtube.com/@RiyadKetami')
    .replaceAll('{abbUrl}', BRAND.abb.url);
}

/** Welcome series email 1, 2 or 3 */
export async function sendWelcomeEmail(email: string, lang: EmailLang, step: 1 | 2 | 3) {
  const settings = await getNewsletterSettings();
  const c = copyFor(lang);
  const w = c.welcome[step - 1]!;
  const magnet = settings.leadMagnet[lang] ?? settings.leadMagnet.en;
  const leadHtml = step === 1 && magnet?.url && magnet.title ? c.leadMagnet(magnet.title, magnet.url) : '';
  const body = fillLinks(w.body.replace('{leadMagnet}', leadHtml), lang);
  const html = renderEmail({
    lang,
    subject: w.subject,
    preheader: w.preheader,
    heading: w.heading,
    bodyHtml: body,
    signOff: c.signOff,
    footer: footerFor(lang, email, settings),
    siteUrl: `${APP_URL}/${lang}`,
  });
  return deliver({ to: email, subject: w.subject, html, kind: `welcome-${step}` as MailKind, marketing: true, replyTo: settings.replyTo });
}

export async function sendWinbackEmail(email: string, lang: EmailLang) {
  const settings = await getNewsletterSettings();
  const c = copyFor(lang);
  const keepUrl = `${APP_URL}/api/newsletter/keep?e=${encodeURIComponent(email)}&t=${unsubToken(email)}&l=${lang}`;
  const html = renderEmail({
    lang,
    subject: c.winback.subject,
    preheader: c.winback.preheader,
    heading: c.winback.heading,
    bodyHtml: c.winback.body,
    cta: { label: c.winback.cta!, url: keepUrl },
    signOff: c.signOff,
    footer: footerFor(lang, email, settings),
    siteUrl: `${APP_URL}/${lang}`,
  });
  return deliver({ to: email, subject: c.winback.subject, html, kind: 'winback', marketing: true, replyTo: settings.replyTo });
}

export async function sendManageLinkEmail(email: string, lang: EmailLang) {
  const settings = await getNewsletterSettings();
  const c = copyFor(lang);
  const html = renderEmail({
    lang,
    subject: c.manage.subject,
    preheader: c.manage.preheader,
    heading: c.manage.heading,
    bodyHtml: c.manage.body,
    cta: { label: c.manage.cta!, url: manageUrl(lang, email, unsubToken(email)) },
    footer: footerFor(lang, email, settings),
    siteUrl: `${APP_URL}/${lang}`,
  });
  return deliver({ to: email, subject: c.manage.subject, html, kind: 'manage', marketing: false, replyTo: settings.replyTo });
}

/** Render one campaign edition for a given recipient context */
export function renderCampaignEdition(o: {
  lang: EmailLang;
  subject: string;
  previewText?: string;
  bodyHtml: string;
  footer: EmailFooter;
}): string {
  return renderEmail({
    lang: o.lang,
    subject: o.subject,
    preheader: o.previewText,
    bodyHtml: o.bodyHtml,
    footer: o.footer,
    siteUrl: `${APP_URL}/${o.lang}`,
  });
}

/** Test send of one edition to the admin, with a [TEST] subject */
export async function sendTestEdition(o: { to: string; lang: EmailLang; subject: string; previewText?: string; bodyHtml: string }) {
  const settings = await getNewsletterSettings();
  const subject = `[TEST] ${o.subject}`;
  const html = renderCampaignEdition({ ...o, subject, footer: footerFor(o.lang, o.to, settings) });
  return deliver({ to: o.to, subject, html, kind: 'test', marketing: false, replyTo: settings.replyTo });
}
