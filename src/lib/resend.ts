import { Resend } from 'resend';

export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@riyadketami.com';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'riyad@ketami.net';

// Module-level singleton — created once, reused across requests
let _resend: Resend | null = null;
export function getResend(): Resend | null {
  if (!RESEND_API_KEY) return null;
  _resend ??= new Resend(RESEND_API_KEY);
  return _resend;
}

/** Escape user-supplied strings before interpolating into HTML */
export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Wrap inner content in the shared branded email shell (KETAMI brand book v1.0) */
export function emailShell(eyebrow: string, inner: string): string {
  return `<div style="font-family:monospace;max-width:600px;margin:0 auto;padding:32px;background:#111111;color:#F4F4EF;border:1px solid #2A2A28;border-radius:8px;">
  <p style="color:#00CD29;font-size:11px;letter-spacing:0.2em;margin:0 0 20px;">${eyebrow}</p>
  ${inner}
</div>`;
}
