'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import type { Dictionary } from '@/lib/dictionaries';
import type { Locale } from '@/i18n/config';

const LANGS: Locale[] = ['ar', 'en', 'fr'];
const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export type NewsletterSource = 'homepage' | 'blog-cta' | 'links-page' | 'subscribe-page' | 'archive' | 'other';

interface NewsletterFormProps {
  dict: Dictionary;
  locale?: Locale;
  variant?: 'inline' | 'stacked';
  className?: string;
  /** Where the form sits, stored with the signup */
  source?: NewsletterSource;
}

type TurnstileApi = { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };

/** Cloudflare Turnstile widget, only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set */
function useTurnstile(ref: React.RefObject<HTMLDivElement | null>, active: boolean, locale: Locale) {
  const [token, setToken] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!TURNSTILE_KEY || !active || !ref.current) return;
    let widgetId: string | null = null;
    const w = window as unknown as { turnstile?: TurnstileApi };
    const mount = () => {
      if (!ref.current || !w.turnstile) return;
      widgetId = w.turnstile.render(ref.current, {
        sitekey: TURNSTILE_KEY,
        language: locale,
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(undefined),
      });
    };
    if (w.turnstile) mount();
    else {
      let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.dataset.turnstile = '1';
        document.head.appendChild(script);
      }
      script.addEventListener('load', mount, { once: true });
    }
    return () => {
      if (widgetId && w.turnstile) w.turnstile.remove(widgetId);
    };
  }, [ref, active, locale]);
  return token;
}

function readUtm(): { source?: string; medium?: string; campaign?: string } | undefined {
  try {
    const q = new URLSearchParams(window.location.search);
    const utm = {
      source: q.get('utm_source')?.slice(0, 120) || undefined,
      medium: q.get('utm_medium')?.slice(0, 120) || undefined,
      campaign: q.get('utm_campaign')?.slice(0, 120) || undefined,
    };
    return utm.source || utm.medium || utm.campaign ? utm : undefined;
  } catch {
    return undefined;
  }
}

export default function NewsletterForm({
  dict,
  locale = 'en',
  variant = 'inline',
  className = '',
  source = 'other',
}: NewsletterFormProps) {
  const t = dict.home.newsletter;
  const n = dict.newsletter;
  const [step, setStep] = useState<'email' | 'language'>('email');
  const [email, setEmail] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Locale>(locale);
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState('');
  const [startedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileToken = useTurnstile(turnstileRef, step === 'language', locale);

  function isValidEmail(v: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !isValidEmail(email.trim())) {
      setError(t.email_error);
      return;
    }
    setStep('language');
  }

  function handleBack() {
    setStep('email');
    setError('');
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!preferredLanguage) {
      setError(t.language_error);
      return;
    }
    if (!consent) {
      setError(n.consent_error);
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          preferredLanguage,
          source,
          utm: readUtm(),
          consent: true,
          company,
          startedAt,
          turnstileToken,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const isInline = variant === 'inline';

  if (status === 'success') {
    const confirmationMsg =
      t.confirmation[preferredLanguage as keyof typeof t.confirmation] ??
      t.confirmation.en;
    return (
      <div
        className={`anim-in flex items-center gap-3 glass border border-matrix/30 rounded-[var(--radius-md)] px-6 py-4 ${className}`}
      >
        <Check size={18} className="text-matrix shrink-0" />
        {/* The message is in the chosen language, whatever the page locale */}
        <p
          className="text-sm text-text-0"
          lang={preferredLanguage}
          dir={preferredLanguage === 'ar' ? 'rtl' : 'ltr'}
        >
          {confirmationMsg}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={step === 'email' ? handleContinue : handleConfirm}
      className={`flex flex-col gap-3 ${className}`}
      noValidate
    >
        {/* Honeypot: hidden from people, filled by bots */}
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label>
            Company
            <input type="text" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
        </div>
        {step === 'email' ? (
          <div
            key="email-step"
            className={`anim-in flex ${isInline ? 'flex-col sm:flex-row' : 'flex-col'} gap-3`}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder={t.placeholder}
              aria-label={dict.contact.fields.email}
              autoComplete="email"
              className={`w-full px-4 rounded-[var(--radius-md)] bg-bg-2 border border-border text-text-0 placeholder:text-text-2 text-sm focus:outline-none focus:border-matrix transition-colors duration-[var(--duration-fast)] ${isInline ? 'h-11' : 'py-3.5'}`}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="h-11 px-6 rounded-[var(--radius-md)] bg-matrix text-bg-0 text-sm font-semibold hover:bg-matrix/90 disabled:opacity-50 transition-colors duration-[var(--duration-fast)] shrink-0 cursor-pointer hover:shadow-[0_0_20px_rgba(0,255,102,0.25)]"
            >
              {t.cta}
            </button>
          </div>
        ) : (
          <div
            key="language-step"
            className="anim-in flex flex-col gap-3"
          >
            <p className="text-xs text-text-2 font-medium">{t.step2_label}</p>

            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-label={t.step2_label}
            >
              {LANGS.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  role="radio"
                  aria-checked={preferredLanguage === lang}
                  onClick={() => {
                    setPreferredLanguage(lang);
                    if (error) setError('');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-[var(--duration-fast)] cursor-pointer select-none ${
                    preferredLanguage === lang
                      ? 'bg-matrix text-bg-0 border-matrix'
                      : 'border-border text-text-1 hover:border-matrix/50 hover:shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                  }`}
                >
                  {t.language_options[lang as keyof typeof t.language_options]}
                </button>
              ))}
            </div>

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-text-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (error) setError('');
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#00CD29] cursor-pointer"
              />
              <span>
                {n.consent_before}
                <a href={`/${locale}/privacy`} target="_blank" rel="noopener" className="underline hover:text-signal">
                  {n.consent_link}
                </a>
                {n.consent_after}
              </span>
            </label>

            {TURNSTILE_KEY && <div ref={turnstileRef} className="min-h-[65px]" />}

            <div className={`flex ${isInline ? 'flex-col sm:flex-row' : 'flex-col'} gap-3 items-start`}>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-11 px-6 rounded-[var(--radius-md)] bg-matrix text-bg-0 text-sm font-semibold hover:bg-matrix/90 disabled:opacity-50 transition-colors duration-[var(--duration-fast)] shrink-0 cursor-pointer hover:shadow-[0_0_20px_rgba(0,255,102,0.25)]"
              >
                {status === 'loading' ? (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-bg-0 border-t-transparent animate-spin" />
                ) : (
                  t.confirm
                )}
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="h-11 px-4 text-xs text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)] cursor-pointer"
              >
                {t.back}
              </button>
            </div>
          </div>
        )}

      {error && (
        <p
          className="anim-in text-xs text-danger font-mono"
        >
          {error}
        </p>
      )}

      {status === 'error' && !error && (
        <p className="text-xs text-danger font-mono">{t.error}</p>
      )}
    </form>
  );
}
