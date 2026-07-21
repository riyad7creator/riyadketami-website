'use client';

import { useState } from 'react';
import { Reveal } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';
import MatrixRain from '@/components/ui/MatrixRain';
import type { Dictionary } from '@/lib/dictionaries';

interface NewsletterSectionProps {
  dict: Dictionary;
}

export default function NewsletterSection({ dict }: NewsletterSectionProps) {
  const t = dict.home.newsletter;
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section id="newsletter" className="relative py-20 sm:py-28 px-5 sm:px-8 bg-bg-1/40 border-y border-border overflow-hidden">
      <MatrixRain opacity={0.05} />
      <div className="relative z-10 max-w-xl mx-auto text-center flex flex-col items-center gap-6">
        <Reveal direction="up">
          <MatrixText text={t.eyebrow} className="text-xs tracking-[0.2em] text-matrix" />
        </Reveal>

        <Reveal direction="up" delay={0.08}>
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-text-0">
            {t.title}
          </h2>
        </Reveal>

        <Reveal direction="up" delay={0.16}>
          <p className="text-text-1 text-base sm:text-lg leading-relaxed">{t.subtitle}</p>
        </Reveal>

        <Reveal direction="up" delay={0.24} className="w-full">
          {status === 'success' ? (
            <div className="glass border border-matrix/30 rounded-[var(--radius-md)] px-6 py-4">
              <p className="font-mono text-sm text-matrix">{t.success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
              <label htmlFor="newsletter-email" className="sr-only">{dict.contact.fields.email}</label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.placeholder}
                required
                className="flex-1 h-11 px-4 rounded-[var(--radius-md)] bg-bg-2 border border-border text-text-0 placeholder:text-text-1 text-sm focus:outline-none focus:border-matrix transition-colors duration-[var(--duration-fast)]"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-11 px-6 rounded-[var(--radius-md)] bg-matrix text-bg-0 text-sm font-semibold hover:bg-matrix/90 disabled:opacity-50 transition-colors duration-[var(--duration-fast)] shrink-0 cursor-pointer"
              >
                {status === 'loading' ? (
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-bg-0 border-t-transparent animate-spin" />
                ) : (
                  t.cta
                )}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="text-xs text-danger font-mono mt-2">Something went wrong. Try again.</p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
