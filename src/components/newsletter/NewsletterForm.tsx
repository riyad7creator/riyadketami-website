'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Dictionary } from '@/lib/dictionaries';
import type { Locale } from '@/i18n/config';

const LANGS: Locale[] = ['ar', 'en', 'fr'];

interface NewsletterFormProps {
  dict: Dictionary;
  locale?: Locale;
  variant?: 'inline' | 'stacked';
  className?: string;
}

export default function NewsletterForm({
  dict,
  locale = 'en',
  variant = 'inline',
  className = '',
}: NewsletterFormProps) {
  const t = dict.home.newsletter;
  const [step, setStep] = useState<'email' | 'language'>('email');
  const [email, setEmail] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState<Locale>(locale);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

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
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), preferredLanguage }),
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`flex items-center gap-3 glass border border-matrix/30 rounded-[var(--radius-md)] px-6 py-4 ${className}`}
      >
        <Check size={18} className="text-matrix shrink-0" />
        <p className="text-sm text-text-0">{confirmationMsg}</p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={step === 'email' ? handleContinue : handleConfirm}
      className={`flex flex-col gap-3 ${className}`}
      noValidate
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === 'email' ? (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`flex ${isInline ? 'flex-col sm:flex-row' : 'flex-col'} gap-3`}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder={t.placeholder}
              className="flex-1 h-11 px-4 rounded-[var(--radius-md)] bg-bg-2 border border-border text-text-0 placeholder:text-text-2 text-sm focus:outline-none focus:border-matrix transition-colors duration-[var(--duration-fast)]"
              autoFocus
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="h-11 px-6 rounded-[var(--radius-md)] bg-matrix text-bg-0 text-sm font-semibold hover:bg-matrix/90 disabled:opacity-50 transition-colors duration-[var(--duration-fast)] shrink-0 cursor-pointer hover:shadow-[0_0_20px_rgba(0,255,102,0.25)]"
            >
              {t.cta}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="language-step"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-3"
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
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-danger font-mono"
        >
          {error}
        </motion.p>
      )}

      {status === 'error' && !error && (
        <p className="text-xs text-danger font-mono">{t.error}</p>
      )}
    </form>
  );
}
