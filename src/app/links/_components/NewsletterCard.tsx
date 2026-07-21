'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import MatrixText from '@/components/ui/MatrixText';

export default function NewsletterCard({ subscriberCount }: { subscriberCount: number }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const countLabel =
    subscriberCount >= 1000 ? `${Math.floor(subscriberCount / 1000)}K+` : `${subscriberCount}+`;

  return (
    <section
      id="newsletter"
      className="w-full glass rounded-[var(--radius-lg)] p-5 flex flex-col gap-4"
      aria-label="Newsletter signup"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-matrix/10 border border-matrix/20 flex items-center justify-center shrink-0">
          <Mail size={14} className="text-matrix" />
        </div>
        <div className="flex flex-col gap-0.5">
          <MatrixText text="// weekly insights" className="text-[9px] tracking-[0.18em] text-matrix" />
          <p className="font-display font-semibold text-text-0 text-sm mt-0.5">
            AI &amp; business insights, every week.
          </p>
          <p className="text-xs text-text-2">
            Free. Join {countLabel} readers. Unsubscribe anytime.
          </p>
        </div>
      </div>

      {status === 'success' ? (
        <p className="font-mono text-xs text-matrix tracking-[0.15em]">
          {`// you're in. Check your inbox.`}
        </p>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-2">
          <label htmlFor="links-newsletter-email" className="sr-only">Email</label>
          <input
            id="links-newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-text-0 placeholder:text-text-1 focus:outline-none focus:border-matrix/50 transition-colors"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] py-2.5 hover:bg-matrix/90 disabled:opacity-50 transition-colors"
          >
            {status === 'loading' ? '...' : 'Subscribe free →'}
          </button>
          {status === 'error' && (
            <p className="text-xs text-danger text-center">Something went wrong. Try again.</p>
          )}
        </form>
      )}
    </section>
  );
}
