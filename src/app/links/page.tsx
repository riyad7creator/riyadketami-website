'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ArrowUpRight, Mail, Zap } from 'lucide-react';
import MatrixText from '@/components/ui/MatrixText';
import MatrixRain from '@/components/ui/MatrixRain';

interface LinkItem {
  _id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
}

const ICON_MAP: Record<string, string> = {
  youtube: '▶',
  tiktok: '◈',
  instagram: '◉',
  facebook: '◧',
  twitter: '✦',
  x: '✦',
  linkedin: '◧',
  github: '⬡',
  newsletter: '✉',
  book: '◻',
  star: '★',
  link: '→',
};

function resolveIcon(icon?: string): string {
  return ICON_MAP[icon ?? 'link'] ?? '→';
}

const SOCIAL_ICONS: Record<string, string> = {
  tiktok: 'TK',
  youtube: 'YT',
  instagram: 'IG',
  twitter: 'X',
  x: 'X',
  linkedin: 'LI',
};

const STATIC_LINKS: LinkItem[] = [
  { _id: 's1', title: 'Newsletter — Weekly AI & Business Insights', url: '#newsletter', icon: 'newsletter', description: 'Free, every week. Join 5,000+ readers.' },
  { _id: 's2', title: 'AI Business Masterclass', url: '#', icon: 'star', description: 'Learn to deploy AI in your business.' },
  { _id: 's3', title: 'Book a Strategy Session', url: '/en/contact', icon: 'link', description: '1-on-1 AI consulting — tailored to you.' },
  { _id: 's4', title: 'TikTok — @riyadketami', url: 'https://tiktok.com/@riyadketami', icon: 'tiktok' },
  { _id: 's5', title: 'YouTube Channel', url: 'https://youtube.com/@riyadketami', icon: 'youtube' },
  { _id: 's6', title: 'Instagram', url: 'https://instagram.com/riyadketami', icon: 'instagram' },
];

const SOCIAL_LINKS = [
  { abbr: 'TK', label: 'TikTok', href: 'https://tiktok.com/@riyadketami', count: '200K+' },
  { abbr: 'YT', label: 'YouTube', href: 'https://youtube.com/@riyadketami', count: '50K+' },
  { abbr: 'IG', label: 'Instagram', href: 'https://instagram.com/riyadketami', count: '80K+' },
];

export default function LinksPage() {
  const [links, setLinks] = useState<LinkItem[] | null>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/links')
      .then((r) => r.json())
      .then((data: LinkItem[]) => setLinks(Array.isArray(data) && data.length > 0 ? data : null))
      .catch(() => setLinks(null));
  }, []);

  const displayLinks = links ?? STATIC_LINKS;

  const handleSubscribe = async (e: React.FormEvent) => {
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

  const isSocialLink = (icon?: string) => icon && SOCIAL_ICONS[icon];
  const socialLinks = displayLinks.filter((l) => isSocialLink(l.icon));
  const featuredLinks = displayLinks.filter((l) => !isSocialLink(l.icon));

  return (
    <main className="relative min-h-[100dvh] flex flex-col items-center justify-start bg-bg-0 overflow-hidden px-5 py-12 sm:py-20">

      {/* Matrix rain background */}
      <div className="fixed inset-0 pointer-events-none">
        <MatrixRain opacity={0.04} speed={0.6} density={0.7} />
      </div>

      {/* Ambient glow top */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[480px] h-[240px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(0,255,102,0.07) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">

        {/* Profile */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Avatar with animated pulse ring */}
          <div className="relative flex items-center justify-center">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,255,102,0.15) 0%, transparent 70%)',
                transform: 'scale(1.6)',
              }}
              aria-hidden
            />
            {/* Pulsing ring */}
            <div
              className="absolute inset-0 rounded-full border border-matrix/30"
              style={{
                animation: 'pulse-ring 3s ease-in-out infinite',
                transform: 'scale(1.18)',
              }}
              aria-hidden
            />
            <style>{`
              @keyframes pulse-ring {
                0%, 100% { opacity: 0.3; transform: scale(1.18); }
                50% { opacity: 0.8; transform: scale(1.22); }
              }
            `}</style>
            {/* Avatar */}
            <div className="relative w-20 h-20 rounded-full border-2 border-matrix/50 overflow-hidden bg-bg-1 flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-2xl text-matrix">RK</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-display font-bold text-xl text-text-0 tracking-tight">
              Riyad Ketami
            </h1>
            <MatrixText
              text="Digital Entrepreneur · AI Consultant · Creator"
              className="font-mono text-[10px] tracking-[0.14em] text-text-2"
              autoPlay
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-0 mt-1">
            {SOCIAL_LINKS.map((s, i) => (
              <a
                key={s.abbr}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center px-4 hover:text-matrix transition-colors group"
                style={i < SOCIAL_LINKS.length - 1 ? { borderRight: '1px solid var(--border)' } : {}}
              >
                <span className="font-display font-bold text-sm text-text-0 group-hover:text-matrix transition-colors">
                  {s.count}
                </span>
                <span className="font-mono text-[9px] tracking-[0.15em] text-text-2 mt-0.5">
                  {s.label.toUpperCase()}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Featured links (non-social) */}
        {featuredLinks.length > 0 && (
          <div className="w-full flex flex-col gap-2.5">
            <MatrixText
              text="// featured"
              className="font-mono text-[9px] tracking-[0.2em] text-matrix px-1"
            />
            {featuredLinks.map((link, idx) => {
              const isFirst = idx === 0;
              return (
                <a
                  key={link._id}
                  href={link.url}
                  target={link.url.startsWith('http') ? '_blank' : undefined}
                  rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className={`group rounded-[var(--radius-md)] px-5 py-4 flex items-start gap-4 transition-all duration-[var(--duration-fast)] ${
                    isFirst
                      ? 'bg-matrix/5 border border-matrix/30 hover:border-matrix/60 hover:bg-matrix/8'
                      : 'glass hover:border-matrix/35'
                  }`}
                  style={isFirst ? { boxShadow: '0 0 30px rgba(0,255,102,0.06)' } : undefined}
                >
                  <span
                    className={`font-mono text-base shrink-0 w-5 text-center mt-0.5 ${isFirst ? 'text-matrix' : 'text-matrix'}`}
                    aria-hidden
                  >
                    {resolveIcon(link.icon)}
                  </span>
                  <span className="flex-1 flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-text-0 group-hover:text-white transition-colors truncate">
                      {link.title}
                    </span>
                    {link.description && (
                      <span className="text-xs text-text-2 group-hover:text-text-1 transition-colors">
                        {link.description}
                      </span>
                    )}
                  </span>
                  {isFirst ? (
                    <Zap size={13} className="text-matrix shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  ) : (
                    <ExternalLink size={13} className="text-text-2 group-hover:text-matrix transition-colors shrink-0 mt-0.5" />
                  )}
                </a>
              );
            })}
          </div>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="w-full flex flex-col gap-2.5">
            <MatrixText
              text="// follow"
              className="font-mono text-[9px] tracking-[0.2em] text-matrix px-1"
            />
            <div className="grid grid-cols-3 gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link._id}
                  href={link.url}
                  target={link.url.startsWith('http') ? '_blank' : undefined}
                  rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="group glass rounded-[var(--radius-md)] py-3.5 flex flex-col items-center gap-1.5 hover:border-matrix/40 transition-all duration-[var(--duration-fast)]"
                >
                  <span className="font-mono text-lg text-matrix">{resolveIcon(link.icon)}</span>
                  <span className="font-mono text-[9px] tracking-[0.14em] text-text-2 group-hover:text-text-1 transition-colors">
                    {link.icon?.toUpperCase()}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter */}
        <div
          id="newsletter"
          className="w-full glass rounded-[var(--radius-lg)] p-5 flex flex-col gap-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-matrix/10 border border-matrix/20 flex items-center justify-center shrink-0">
              <Mail size={14} className="text-matrix" />
            </div>
            <div className="flex flex-col gap-0.5">
              <MatrixText text="// weekly insights" className="text-[9px] tracking-[0.18em] text-matrix" />
              <p className="font-display font-semibold text-text-0 text-sm mt-0.5">
                AI & business insights, every week.
              </p>
              <p className="text-xs text-text-2">Free. Join 5,000+ readers. Unsubscribe anytime.</p>
            </div>
          </div>

          {status === 'success' ? (
            <p className="font-mono text-xs text-matrix tracking-[0.15em]">// you&apos;re in — check your inbox.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors"
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
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3 w-full">
          <Link
            href="/en/contact"
            className="flex-1 glass rounded-[var(--radius-md)] py-3 text-center text-sm font-medium text-text-1 hover:border-matrix/40 hover:text-text-0 transition-all duration-[var(--duration-fast)]"
          >
            Get in touch
          </Link>
          <Link
            href="/en"
            className="flex-1 flex items-center justify-center gap-1.5 bg-matrix text-bg-0 rounded-[var(--radius-md)] py-3 text-center text-sm font-semibold hover:bg-matrix/90 transition-colors"
          >
            Visit website <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Footer */}
        <p className="font-mono text-[9px] text-text-2 tracking-[0.12em] pb-4">
          © {new Date().getFullYear()} Riyad Ketami
        </p>
      </div>
    </main>
  );
}
