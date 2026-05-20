'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, TrendingUp, TrendingDown, Eye, Globe, AlertCircle, Languages } from 'lucide-react';
import Link from 'next/link';

interface PostRow {
  _id: string;
  title: string;
  slug: string;
  views: number;
  language?: string;
  category?: string;
  createdAt: string;
}

interface TranslationGap {
  _id: string;
  title: string;
  slug: string;
  createdAt: string;
  translatedLangs: string[];
}

interface LangRow { _id: string | null; count: number }

interface Analytics {
  topAllTime: PostRow[];
  topThisWeek: PostRow[];
  viewsThisWeek: number;
  viewsLastWeek: number;
  langSplit: LangRow[];
  zeroViewPosts: PostRow[];
  translationGaps: TranslationGap[];
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <span className="text-xs text-text-2">—</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-matrix' : 'text-danger'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{pct}%
    </span>
  );
}

const LANG_LABELS: Record<string, string> = { en: 'English', fr: 'French', ar: 'Arabic' };
const FLAG: Record<string, string> = { en: '🇬🇧', fr: '🇫🇷', ar: '🇸🇦' };

export default function PostAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics?mode=overview');
      if (res.ok) setData(await res.json() as Analytics);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="text-matrix animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-text-2 py-12 text-center">Failed to load analytics.</p>;
  }

  const totalLangViews = data.langSplit.reduce((s, r) => s + r.count, 0);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// post-analytics</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Post Analytics</h1>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass border border-border rounded-[var(--radius-lg)] p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-text-2 text-xs">
            <Eye size={12} /> Views this week
          </div>
          <p className="text-2xl font-display font-bold text-text-0">{data.viewsThisWeek.toLocaleString()}</p>
          <Delta current={data.viewsThisWeek} previous={data.viewsLastWeek} />
        </div>
        <div className="glass border border-border rounded-[var(--radius-lg)] p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-text-2 text-xs">
            <AlertCircle size={12} /> Zero-view posts
          </div>
          <p className="text-2xl font-display font-bold text-text-0">{data.zeroViewPosts.length}</p>
          <span className="text-xs text-text-2">published, never seen</span>
        </div>
        <div className="glass border border-border rounded-[var(--radius-lg)] p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-text-2 text-xs">
            <Languages size={12} /> Translation gaps
          </div>
          <p className="text-2xl font-display font-bold text-text-0">{data.translationGaps.length}</p>
          <span className="text-xs text-text-2">EN posts missing FR/AR</span>
        </div>
      </div>

      {/* Language split */}
      {data.langSplit.length > 0 && (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-0">
            <Globe size={14} className="text-matrix" /> Reader language split (this week)
          </div>
          <div className="space-y-2">
            {data.langSplit.map(row => {
              const lang = row._id ?? 'unknown';
              const pct = totalLangViews ? Math.round((row.count / totalLangViews) * 100) : 0;
              return (
                <div key={lang} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-text-2 font-mono shrink-0">
                    {FLAG[lang] ?? '🌐'} {LANG_LABELS[lang] ?? lang}
                  </span>
                  <div className="flex-1 bg-bg-1 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-matrix rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-text-1 w-14 text-right font-mono">{row.count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top posts this week */}
      {data.topThisWeek.length > 0 && (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-0">Top posts this week</h2>
          <div className="space-y-1">
            {data.topThisWeek.map((post, i) => (
              <div key={post._id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                <span className="w-5 text-xs font-mono text-text-2 shrink-0">#{i + 1}</span>
                <Link
                  href={`/admin/posts/${post._id}`}
                  className="flex-1 text-sm text-text-0 hover:text-matrix transition-colors truncate"
                >
                  {post.title ?? post.slug}
                </Link>
                <span className="text-xs font-mono text-matrix shrink-0">{post.views} views</span>
                <span className="text-[10px] font-mono text-text-2 uppercase shrink-0">{post.language}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top posts all time */}
      <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-0">Top posts all time</h2>
        <div className="space-y-1">
          {data.topAllTime.length === 0 ? (
            <p className="text-sm text-text-2 py-4 text-center">No published posts yet.</p>
          ) : (
            data.topAllTime.map((post, i) => (
              <div key={post._id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                <span className="w-5 text-xs font-mono text-text-2 shrink-0">#{i + 1}</span>
                <Link
                  href={`/admin/posts/${post._id}`}
                  className="flex-1 text-sm text-text-0 hover:text-matrix transition-colors truncate"
                >
                  {post.title ?? post.slug}
                </Link>
                <span className="text-xs font-mono text-matrix shrink-0">{post.views.toLocaleString()} views</span>
                <span className="text-[10px] font-mono text-text-2 uppercase shrink-0">{post.language}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Translation gaps */}
      {data.translationGaps.length > 0 && (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-0">Translation gaps</h2>
          <p className="text-xs text-text-2">EN posts missing French or Arabic translation.</p>
          <div className="space-y-1">
            {data.translationGaps.map(post => {
              const missing = ['fr', 'ar'].filter(l => !post.translatedLangs?.includes(l));
              return (
                <div key={post._id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <Link
                    href={`/admin/posts/${post._id}`}
                    className="flex-1 text-sm text-text-0 hover:text-matrix transition-colors truncate"
                  >
                    {post.title}
                  </Link>
                  <div className="flex gap-1 shrink-0">
                    {missing.map(l => (
                      <span key={l} className="text-[10px] font-mono bg-warning/10 text-warning px-1.5 py-0.5 rounded uppercase">
                        {FLAG[l]} {l} missing
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zero-view posts */}
      {data.zeroViewPosts.length > 0 && (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text-0">Published with zero views</h2>
          <p className="text-xs text-text-2">Consider promoting these or reviewing their content.</p>
          <div className="space-y-1">
            {data.zeroViewPosts.map(post => (
              <div key={post._id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                <Link
                  href={`/admin/posts/${post._id}`}
                  className="flex-1 text-sm text-text-0 hover:text-matrix transition-colors truncate"
                >
                  {post.title}
                </Link>
                <span className="text-[10px] font-mono text-text-2 uppercase shrink-0">{post.language}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
