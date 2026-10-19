'use client';

import { useState } from 'react';
import type { Locale } from '@/i18n/config';

interface Labels {
  request_body: string;
  email_label: string;
  request_button: string;
  request_sent: string;
  language_label: string;
  status_label: string;
  status_active: string;
  status_unsubscribed: string;
  save: string;
  saved: string;
  unsubscribe: string;
  resubscribe: string;
  error: string;
}

const btn = 'h-11 rounded-[var(--radius-md)] px-5 text-sm font-semibold transition-colors disabled:opacity-50';
const input = 'h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg-2 px-4 text-sm text-text-0 focus:border-matrix focus:outline-none';

/** Ask for a personal settings link by email */
export function RequestLinkForm({ lang, t }: { lang: Locale; t: Labels }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('busy');
    try {
      const res = await fetch('/api/newsletter/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email: email.trim(), lang }),
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  }
  if (state === 'sent') return <p className="rounded-[var(--radius-md)] border border-matrix/30 px-4 py-3 text-sm text-text-0">{t.request_sent}</p>;
  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-text-1">{t.request_body}</p>
      <label className="sr-only" htmlFor="pref-email">{t.email_label}</label>
      <input id="pref-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email_label} className={input} />
      <button type="submit" disabled={state === 'busy'} className={`${btn} w-fit bg-matrix text-bg-0 hover:bg-matrix/90`}>{t.request_button}</button>
      {state === 'error' && <p className="text-xs text-danger">{t.error}</p>}
    </form>
  );
}

/** Change language, unsubscribe or subscribe again, from a signed link */
export function ManageForm({
  email,
  token,
  initialLang,
  initialSubscribed,
  t,
  languageNames,
}: {
  email: string;
  token: string;
  initialLang: Locale;
  initialSubscribed: boolean;
  t: Labels;
  languageNames: Record<Locale, string>;
}) {
  const [lang, setLang] = useState<Locale>(initialLang);
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [state, setState] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function update(patch: { preferredLanguage?: Locale; subscribed?: boolean }) {
    setState('busy');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', email, token, ...patch }),
      });
      const data = (await res.json()) as { subscribed?: boolean; preferredLanguage?: Locale | null; error?: string };
      if (!res.ok) throw new Error(data.error);
      if (typeof data.subscribed === 'boolean') setSubscribed(data.subscribed);
      if (data.preferredLanguage) setLang(data.preferredLanguage);
      if (data.error) setMessage(data.error);
      setState('saved');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="font-mono text-sm text-text-1" dir="ltr">{email}</p>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-text-2">{t.language_label}</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.language_label}>
          {(['en', 'fr', 'ar'] as Locale[]).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={lang === l}
              onClick={() => setLang(l)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${lang === l ? 'border-matrix bg-matrix text-bg-0' : 'border-border text-text-1 hover:border-matrix/50'}`}
            >
              {languageNames[l]}
            </button>
          ))}
        </div>
        <button type="button" disabled={state === 'busy'} onClick={() => update({ preferredLanguage: lang })} className={`${btn} mt-2 w-fit bg-matrix text-bg-0 hover:bg-matrix/90`}>
          {t.save}
        </button>
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-5">
        <span className="text-xs font-medium text-text-2">{t.status_label}</span>
        <span className="text-sm text-text-0">{subscribed ? t.status_active : t.status_unsubscribed}</span>
        <button
          type="button"
          disabled={state === 'busy'}
          onClick={() => update({ subscribed: !subscribed })}
          className={`${btn} w-fit border border-border text-text-1 hover:border-border-hover`}
        >
          {subscribed ? t.unsubscribe : t.resubscribe}
        </button>
      </div>
      {state === 'saved' && !message && <p className="text-xs text-matrix">{t.saved}</p>}
      {message && <p className="text-xs text-warning">{message}</p>}
      {state === 'error' && <p className="text-xs text-danger">{t.error}</p>}
    </div>
  );
}
