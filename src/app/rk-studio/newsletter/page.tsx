'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Download, Upload, Send, Search, X, ChevronDown, Check, AlertCircle, BarChart2, TrendingUp } from 'lucide-react';
import InlineDeleteConfirm from '@/components/admin/InlineDeleteConfirm';

interface Campaign {
  _id: string;
  subject: string;
  sentAt: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
}

interface GrowthDay { _id: string; count: number }
interface SourceRow { _id: string | null; count: number }

interface Subscriber {
  _id: string;
  email: string;
  preferredLanguage?: string;
  createdAt: string;
}

interface NewsletterResponse {
  subscribers: Subscriber[];
  total: number;
}

interface StatsResponse {
  total: number;
  byLanguage: {
    ar: number;
    en: number;
    fr: number;
    unknown: number;
  };
}

type LangFilter = 'all' | 'ar' | 'en' | 'fr';

const inputCls = 'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors duration-[var(--duration-fast)]';

const langLabel: Record<string, string> = { ar: 'AR', en: 'EN', fr: 'FR' };
const langFullLabel: Record<string, string> = { ar: 'Arabic', en: 'English', fr: 'French' };
const LANGS: LangFilter[] = ['ar', 'en', 'fr'];

function LanguageEditor({
  subscriber,
  onUpdate,
}: {
  subscriber: Subscriber;
  onUpdate: (updated: Subscriber) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!editing) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editing]);

  async function handleSelect(lang: string | null) {
    const previousLang = subscriber.preferredLanguage;
    const newLang = lang ?? undefined;

    // Optimistic update
    onUpdate({ ...subscriber, preferredLanguage: newLang });
    setEditing(false);
    setSaving(true);
    setSaved(false);
    setSaveError(false);

    try {
      const res = await fetch(`/api/newsletter/subscribers/${subscriber._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredLanguage: lang }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // Revert on error
      onUpdate({ ...subscriber, preferredLanguage: previousLang });
      setSaveError(true);
      setTimeout(() => setSaveError(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const currentLabel = subscriber.preferredLanguage
    ? langLabel[subscriber.preferredLanguage]
    : '—';

  if (editing) {
    return (
      <div ref={containerRef} className="relative shrink-0">
        <div className="absolute z-20 top-0 left-0 min-w-[120px] glass border border-border rounded-[var(--radius-md)] overflow-hidden shadow-lg py-1">
          <button
            onClick={() => handleSelect(null)}
            className="w-full text-left px-3 py-1.5 text-xs text-text-2 hover:bg-surface transition-colors"
          >
            — (none)
          </button>
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => handleSelect(l)}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-surface ${
                subscriber.preferredLanguage === l
                  ? 'text-matrix font-medium'
                  : 'text-text-1'
              }`}
            >
              {langFullLabel[l]} ({langLabel[l]})
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={saving}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border shrink-0 transition-all duration-[var(--duration-fast)] cursor-pointer ${
        subscriber.preferredLanguage
          ? 'bg-matrix text-bg-0 border-matrix hover:shadow-[0_0_10px_rgba(0,255,102,0.3)]'
          : 'bg-surface text-text-2 border-border hover:border-border-hover'
      } ${saving ? 'opacity-60' : ''}`}
      title="Click to edit language"
    >
      {currentLabel}
      {saved && <Check size={10} className="text-bg-0" />}
      {saveError && <AlertCircle size={10} className="text-bg-0" />}
    </button>
  );
}

export default function AdminNewsletterPage() {
  const [data, setData] = useState<NewsletterResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [langFilter, setLangFilter] = useState<LangFilter>('all');
  const [exportOpen, setExportOpen] = useState(false);
  const limit = 50;

  // Import state
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  // Send newsletter state
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendForm, setSendForm] = useState({ subject: '', body: '', preview: '' });
  const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null);
  const [sendError, setSendError] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (langFilter !== 'all') params.set('lang', langFilter);
    fetch(`/api/newsletter/subscribers?${params}`)
      .then((r) => r.json())
      .then((d: NewsletterResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, debouncedSearch, langFilter]);

  const loadStats = useCallback(() => {
    fetch('/api/newsletter/stats')
      .then((r) => r.json())
      .then((d: StatsResponse) => setStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadStats(); }, [loadStats]);

  // Export CSV via API
  const handleExport = (filter: LangFilter) => {
    const params = filter !== 'all' ? `?lang=${filter}` : '';
    window.open(`/api/newsletter/export${params}`, '_blank');
    setExportOpen(false);
  };

  // Delete subscriber
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/newsletter/subscribers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setData((prev) => prev ? {
        ...prev,
        subscribers: prev.subscribers.filter((s) => s._id !== id),
        total: prev.total - 1,
      } : null);
      void loadStats();
    }
  };

  // Update subscriber in local list (optimistic)
  const handleSubscriberUpdate = (updated: Subscriber) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            subscribers: prev.subscribers.map((s) =>
              s._id === updated._id ? updated : s
            ),
          }
        : null
    );
    void loadStats();
  };

  // Import CSV
  const handleCSVImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    const text = await file.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().includes('email') ? lines.slice(1) : lines;
    const entries = dataLines.map((line) => {
      const cols = line.split(',');
      const email = cols[0]?.trim().replace(/^["']|["']$/g, '') ?? '';
      const preferredLanguage = cols[1]?.trim().replace(/^["']|["']$/g, '') as 'ar' | 'en' | 'fr' | undefined;
      return { email, preferredLanguage: ['ar', 'en', 'fr'].includes(preferredLanguage ?? '') ? preferredLanguage : undefined };
    }).filter((e) => e.email);

    const res = await fetch('/api/newsletter/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    const result = await res.json() as { imported: number; skipped: number; error?: string };
    if (res.ok) {
      setImportResult({ imported: result.imported, skipped: result.skipped });
      void load();
      void loadStats();
    }
    setImporting(false);
  };

  // Send newsletter
  const handleSend = async () => {
    if (!sendForm.subject.trim() || !sendForm.body.trim()) return;
    setSending(true);
    setSendError('');
    setSendResult(null);
    const res = await fetch('/api/newsletter/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sendForm),
    });
    const result = await res.json() as { sent?: number; total?: number; error?: string };
    if (res.ok && result.sent !== undefined) {
      setSendResult({ sent: result.sent, total: result.total ?? 0 });
    } else {
      setSendError(result.error ?? 'Send failed.');
    }
    setSending(false);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="font-mono text-xs text-matrix tracking-[0.15em]">// email list</span>
          <h1 className="font-display font-bold text-2xl text-text-0 mt-1 flex items-center gap-2">
            Newsletter
            {data && (
              <span className="font-mono text-sm text-matrix">{data.total.toLocaleString()}</span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => csvRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 px-3 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
          >
            <Upload size={13} />
            {importing ? 'Importing...' : 'Import CSV'}
          </button>

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex items-center gap-2 px-3 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
            >
              <Download size={13} /> Export CSV <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] glass border border-border rounded-[var(--radius-md)] overflow-hidden shadow-lg">
                  <button onClick={() => handleExport('all')} className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-surface transition-colors">All subscribers</button>
                  <button onClick={() => handleExport('en')} className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-surface transition-colors">English only</button>
                  <button onClick={() => handleExport('fr')} className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-surface transition-colors">French only</button>
                  <button onClick={() => handleExport('ar')} className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-surface transition-colors">Arabic only</button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => { setSendOpen((o) => !o); setSendResult(null); setSendError(''); }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
          >
            <Send size={13} /> Send
          </button>
        </div>
      </div>

      <input
        ref={csvRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && void handleCSVImport(e.target.files[0])}
      />

      {/* Import result */}
      {importResult && (
        <div className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] bg-matrix/[0.08] border border-matrix/30 text-sm text-text-1">
          <span>Imported <strong className="text-matrix">{importResult.imported}</strong> subscribers. <span className="text-text-2">{importResult.skipped} skipped (already exist).</span></span>
          <button onClick={() => setImportResult(null)} className="text-text-2 hover:text-text-1"><X size={12} /></button>
        </div>
      )}

      {/* Send newsletter panel */}
      {sendOpen && (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-5 flex flex-col gap-4">
          <h2 className="text-sm font-medium text-text-0 flex items-center gap-2">
            <Send size={13} className="text-matrix" /> Send newsletter to {data?.total ?? '—'} subscribers
          </h2>
          <div>
            <label className="block text-xs font-medium text-text-2 mb-1.5">Subject *</label>
            <input
              value={sendForm.subject}
              onChange={(e) => setSendForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Your newsletter subject"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-2 mb-1.5">Preview text</label>
            <input
              value={sendForm.preview}
              onChange={(e) => setSendForm((f) => ({ ...f, preview: e.target.value }))}
              placeholder="Short preview shown in email clients"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-2 mb-1.5">Body (HTML) *</label>
            <textarea
              value={sendForm.body}
              onChange={(e) => setSendForm((f) => ({ ...f, body: e.target.value }))}
              rows={8}
              placeholder="<p>Hello,</p><p>Here's what's new this week...</p>"
              className={`${inputCls} resize-y font-mono text-xs`}
            />
          </div>
          {sendError && <p className="text-xs text-danger">{sendError}</p>}
          {sendResult && (
            <p className="text-xs text-matrix">
              Sent to <strong>{sendResult.sent}</strong> of {sendResult.total} subscribers.
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => void handleSend()}
              disabled={sending || !sendForm.subject.trim() || !sendForm.body.trim()}
              className="px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
            >
              {sending ? 'Sending...' : `Send to ${data?.total ?? '—'} subscribers`}
            </button>
            <button
              onClick={() => { setSendOpen(false); setSendResult(null); setSendError(''); }}
              className="px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats block */}
      {stats && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 glass border border-border rounded-[var(--radius-md)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-2">Total</span>
            <span className="font-mono text-sm font-semibold text-text-0">{stats.total.toLocaleString()}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-matrix" />
            <span className="text-xs text-text-2">EN</span>
            <span className="font-mono text-sm font-semibold text-text-0">{stats.byLanguage.en.toLocaleString()}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-matrix/70" />
            <span className="text-xs text-text-2">FR</span>
            <span className="font-mono text-sm font-semibold text-text-0">{stats.byLanguage.fr.toLocaleString()}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-matrix/40" />
            <span className="text-xs text-text-2">AR</span>
            <span className="font-mono text-sm font-semibold text-text-0">{stats.byLanguage.ar.toLocaleString()}</span>
          </div>
          {stats.byLanguage.unknown > 0 && (
            <>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-2">Unknown</span>
                <span className="font-mono text-sm font-semibold text-text-0">{stats.byLanguage.unknown.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Language filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {(['all', 'en', 'fr', 'ar'] as LangFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setLangFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-[var(--duration-fast)] ${
                langFilter === f
                  ? 'bg-matrix text-bg-0 border-matrix'
                  : 'border-border text-text-2 hover:border-border-hover'
              }`}
            >
              {f === 'all' ? 'All' : langLabel[f]}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subscribers..."
            className={`${inputCls} pl-8`}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2 hover:text-text-1">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="font-mono text-xs text-text-2 py-8">Loading...</p>
      ) : !data || data.subscribers.length === 0 ? (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-10 text-center">
          <p className="font-mono text-xs text-text-2">
            {debouncedSearch ? `No subscribers matching "${debouncedSearch}".` : 'No subscribers yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-lg)] overflow-hidden">
            {data.subscribers.map((sub) => (
              <div key={sub._id} className="flex items-center gap-4 px-5 py-3 group">
                <span className="flex-1 text-sm text-text-1 truncate">{sub.email}</span>
                <LanguageEditor subscriber={sub} onUpdate={handleSubscriberUpdate} />
                <span className="font-mono text-xs text-text-2 shrink-0">
                  {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <InlineDeleteConfirm
                    label={`Remove ${sub.email}`}
                    onConfirm={() => void handleDelete(sub._id)}
                  />
                </span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 glass border border-border text-sm text-text-1 rounded-[var(--radius-sm)] disabled:opacity-40 hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
              >
                ← Prev
              </button>
              <span className="font-mono text-xs text-text-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 glass border border-border text-sm text-text-1 rounded-[var(--radius-sm)] disabled:opacity-40 hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Campaigns history */}
      <CampaignsSection />
    </div>
  );
}

function CampaignsSection() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [growth, setGrowth] = useState<GrowthDay[]>([]);
  const [sourceSplit, setSourceSplit] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'campaigns' | 'growth'>('campaigns');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/campaigns').then(r => r.json() as Promise<{ campaigns: Campaign[] }>),
      fetch('/api/admin/campaigns?mode=growth').then(r => r.json() as Promise<{ growth: GrowthDay[]; sourceSplit: SourceRow[] }>),
    ]).then(([c, g]) => {
      setCampaigns(c.campaigns ?? []);
      setGrowth(g.growth ?? []);
      setSourceSplit(g.sourceSplit ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const maxGrowth = Math.max(...growth.map(d => d.count), 1);

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-text-0 flex items-center gap-2">
          <BarChart2 size={14} className="text-matrix" /> Campaign Analytics
        </h2>
        <div className="flex gap-1">
          {(['campaigns', 'growth'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2.5 py-1 text-xs rounded-full transition-colors ${tab === t ? 'bg-matrix text-bg-0' : 'text-text-2 hover:text-text-1'}`}
            >
              {t === 'campaigns' ? 'Campaigns' : 'Growth'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-text-2 py-4">Loading...</p>
      ) : tab === 'campaigns' ? (
        campaigns.length === 0 ? (
          <p className="text-xs text-text-2 py-4">No campaigns sent yet. Click Send to send your first newsletter.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-lg)] overflow-hidden">
            {campaigns.map(c => {
              const openRate = c.recipientCount > 0 ? ((c.openCount / c.recipientCount) * 100).toFixed(1) : '—';
              const clickRate = c.recipientCount > 0 ? ((c.clickCount / c.recipientCount) * 100).toFixed(1) : '—';
              return (
                <div key={c._id} className="px-4 py-3 flex flex-wrap gap-x-4 gap-y-1 items-center">
                  <span className="flex-1 text-sm text-text-0 min-w-0 truncate">{c.subject}</span>
                  <span className="text-xs text-text-2 shrink-0">
                    {new Date(c.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="font-mono text-xs text-text-2 shrink-0">{c.recipientCount} sent</span>
                  <span className={`font-mono text-xs shrink-0 ${parseFloat(openRate) > 20 ? 'text-matrix' : 'text-text-2'}`}>
                    📧 {openRate}% open
                  </span>
                  <span className="font-mono text-xs text-text-2 shrink-0">
                    🔗 {clickRate}% click
                  </span>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Growth sparkline */}
          {growth.length > 0 ? (
            <div className="glass border border-border rounded-[var(--radius-lg)] p-4">
              <p className="text-xs text-text-2 mb-3 flex items-center gap-1.5">
                <TrendingUp size={12} /> New subscribers per day (last 30 days)
              </p>
              <div className="flex items-end gap-0.5 h-16">
                {growth.map(d => (
                  <div
                    key={d._id}
                    className="flex-1 bg-matrix/60 rounded-t min-h-[2px] hover:bg-matrix transition-colors"
                    style={{ height: `${Math.max(4, (d.count / maxGrowth) * 100)}%` }}
                    title={`${d._id}: ${d.count} new`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-text-2 mt-1">
                <span>{growth[0]?._id}</span>
                <span>{growth[growth.length - 1]?._id}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-2 py-2">No new subscribers in the last 30 days.</p>
          )}

          {/* Source split */}
          {sourceSplit.length > 0 && (
            <div className="glass border border-border rounded-[var(--radius-lg)] p-4 space-y-2">
              <p className="text-xs font-semibold text-text-0">Subscriber sources</p>
              {sourceSplit.map(s => {
                const total = sourceSplit.reduce((acc, r) => acc + r.count, 0);
                const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                return (
                  <div key={s._id ?? 'unknown'} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-text-2 font-mono truncate shrink-0">{s._id ?? 'unknown'}</span>
                    <div className="flex-1 bg-bg-1 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-matrix rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-text-1 w-14 text-right font-mono shrink-0">{s.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
