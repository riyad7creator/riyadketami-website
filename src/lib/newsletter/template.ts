/**
 * Newsletter email layout. Pure functions with no server imports, so the
 * admin composer can render the exact same HTML for its live preview.
 *
 * Table layout for Outlook, a hidden preheader, light design with a dark-mode
 * variant (prefers-color-scheme), lang + dir for Arabic RTL, and a footer with
 * unsubscribe, preferences and the sender's postal address.
 */

export type EmailLang = 'en' | 'fr' | 'ar';

export interface EmailFooter {
  reason: string;
  unsubscribeLabel: string;
  unsubscribeUrl: string;
  manageLabel?: string;
  manageUrl?: string;
  postalAddress?: string;
  senderName?: string;
}

export interface RenderEmailOptions {
  lang: EmailLang;
  subject: string;
  preheader?: string;
  heading?: string;
  /** Trusted HTML (admin-authored or built from our own copy) */
  bodyHtml: string;
  cta?: { label: string; url: string };
  /** Extra HTML under the button (small print) */
  afterCtaHtml?: string;
  signOff?: string;
  footer: EmailFooter;
  siteUrl: string;
}

export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const C = {
  page: '#F4F4EF',
  card: '#FFFFFF',
  line: '#E4E4DE',
  ink: '#111110',
  muted: '#5E5E58',
  link: '#00731A',
  signal: '#00CD29',
  onSignal: '#050505',
};

export function renderEmail(o: RenderEmailOptions): string {
  const rtl = o.lang === 'ar';
  const dir = rtl ? 'rtl' : 'ltr';
  const align = rtl ? 'right' : 'left';
  const font = rtl
    ? "Tahoma,'Segoe UI','Noto Naskh Arabic','Geeza Pro',Arial,sans-serif"
    : "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const lineHeight = rtl ? '1.9' : '1.65';
  const pre = o.preheader ? escHtml(o.preheader) : '';
  const f = o.footer;

  const button = o.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td bgcolor="${C.signal}" style="border-radius:8px;">
<a href="${escHtml(o.cta.url)}" class="btn" style="display:inline-block;padding:14px 24px;font-family:${font};font-size:16px;font-weight:700;color:${C.onSignal};text-decoration:none;border-radius:8px;">${escHtml(o.cta.label)}</a>
</td></tr></table>`
    : '';

  const footerLinks = [
    `<a href="${escHtml(f.unsubscribeUrl)}" class="muted" style="color:${C.muted};text-decoration:underline;">${escHtml(f.unsubscribeLabel)}</a>`,
    f.manageUrl && f.manageLabel
      ? `<a href="${escHtml(f.manageUrl)}" class="muted" style="color:${C.muted};text-decoration:underline;">${escHtml(f.manageLabel)}</a>`
      : '',
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');

  return `<!DOCTYPE html>
<html lang="${o.lang}" dir="${dir}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escHtml(o.subject)}</title>
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
body{margin:0;padding:0;width:100%;-webkit-text-size-adjust:100%}
.content p{margin:0 0 16px}
.content h2{font-size:20px;line-height:1.35;margin:28px 0 12px}
.content h3{font-size:17px;line-height:1.4;margin:24px 0 8px}
.content ul,.content ol{margin:0 0 16px;padding-${rtl ? 'right' : 'left'}:22px}
.content li{margin:0 0 8px}
.content a{color:${C.link};text-decoration:underline}
.content img{max-width:100%;height:auto;border:0}
.content blockquote{margin:0 0 16px;padding-${rtl ? 'right' : 'left'}:14px;border-${rtl ? 'right' : 'left'}:3px solid ${C.signal}}
@media (max-width:620px){.card-pad{padding:24px 20px!important}}
@media (prefers-color-scheme:dark){
.bg{background:#0E0E0D!important}
.card{background:#171716!important;border-color:#2A2A28!important}
.ink,.content{color:#F2F2EC!important}
.muted{color:#A6A69F!important}
.content a{color:#4BE36A!important}
}
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:${C.page};">
${pre ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${pre}${'&nbsp;&zwnj;'.repeat(60)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" bgcolor="${C.card}" style="max-width:600px;background:${C.card};border:1px solid ${C.line};border-radius:12px;">
<tr><td class="card-pad" dir="${dir}" align="${align}" style="padding:32px 36px;font-family:${font};font-size:16px;line-height:${lineHeight};color:${C.ink};text-align:${align};">
<p style="margin:0 0 24px;" dir="ltr" align="${align}"><a href="${escHtml(o.siteUrl)}" class="ink" style="font-family:${font};font-size:14px;font-weight:800;letter-spacing:0.08em;color:${C.ink};text-decoration:none;">RIYAD KETAMI<span style="color:${C.signal};">_</span></a></p>
${o.heading ? `<h1 class="ink" style="margin:0 0 16px;font-family:${font};font-size:24px;line-height:1.3;font-weight:800;color:${C.ink};">${escHtml(o.heading)}</h1>` : ''}
<div class="content" style="color:${C.ink};">${o.bodyHtml}</div>
${button}
${o.afterCtaHtml ? `<div class="muted" style="font-size:14px;color:${C.muted};">${o.afterCtaHtml}</div>` : ''}
${o.signOff ? `<p class="ink" style="margin:24px 0 0;color:${C.ink};">${escHtml(o.signOff)}</p>` : ''}
</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
<tr><td dir="${dir}" align="${align}" class="muted" style="padding:20px 36px 8px;font-family:${font};font-size:12px;line-height:1.7;color:${C.muted};text-align:${align};">
<p style="margin:0 0 8px;">${escHtml(f.reason)}</p>
<p style="margin:0 0 8px;">${footerLinks}</p>
${f.postalAddress ? `<p style="margin:0;">${escHtml(f.senderName ?? 'Riyad Ketami')} · ${escHtml(f.postalAddress)}</p>` : ''}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&zwnj;': '' };

/** Plain-text part: links become "text (url)", blocks become paragraphs */
export function htmlToText(html: string): string {
  return html
    .replace(/<(style|title|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<div style="display:none[\s\S]*?<\/div>/i, '')
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, text: string) => {
      const label = text.replace(/<[^>]+>/g, '').trim();
      const url = href.replace(/&amp;/g, '&');
      return label && label !== url ? `${label} (${url})` : url;
    })
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|h[1-6]|li|ul|ol|blockquote|tr|table|div)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? e)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
