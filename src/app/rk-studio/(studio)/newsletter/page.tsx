'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Upload, Plus, Search, X, ChevronDown, Check, AlertCircle } from 'lucide-react';
import InlineDeleteConfirm from '@/components/admin/InlineDeleteConfirm';
import SetupPanel from '@/components/admin/newsletter/SetupPanel';
import SettingsPanel from '@/components/admin/newsletter/SettingsPanel';
import CampaignsSection from '@/components/admin/newsletter/CampaignsSection';
import { inputCls, btnGhost, btnPrimary } from '@/components/admin/newsletter/ui';

interface Subscriber {
  _id: string;
  email: string;
  preferredLanguage?: string;
  confirmed?: boolean;
  unsubscribed?: boolean;
  unsubscribeReason?: string;
  source?: string;
  createdAt: string;
}

interface NewsletterResponse {
  subscribers: Subscriber[];
  total: number;
}

interface StatsResponse {
  total: number;
  pending: number;
  unsubscribed: number;
  unsubscribedByReason: Record<string, number>;
  byLanguage: { ar: number; en: number; fr: number; unknown: number };
}

type LangFilter = 'all' | 'ar' | 'en' | 'fr';
type StatusFilter = 'active' | 'pending' | 'unsubscribed' | 'all';

const langLabel: Record<string, string> = { ar: 'AR', en: 'EN', fr: 'FR' };
const langFullLabel: Record<string, string> = { ar: 'Arabic', en: 'English', fr: 'French' };
const LANGS: LangFilter[] = ['ar', 'en', 'fr'];
const MAX_IMPORT = 5000;

/** CSV parser that understands quoted cells ("a, b") and escaped quotes */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',' || ch === ';') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows.map((r) => r.map((c) => c.trim()));
}

function StatusBadge({ s }: { s: Subscriber }) {
  if (s.confirmed === false) return <span className="shrink-0 rounded-full border border-warning/40 px-2 py-0.5 text-[10px] font-mono text-warning">pending</span>;
  if (s.unsubscribed) {
    return (
      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-text-2" title={`Reason: ${s.unsubscribeReason ?? 'user'}`}>
        {s.unsubscribeReason && s.unsubscribeReason !== 'user' ? s.unsubscribeReason : 'unsubscribed'}
      </span>
    );
  }
  return null;
}

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
    : '-';

  if (editing) {
    return (
      <div ref={containerRef} className="relative shrink-0">
        <div className="absolute z-20 top-0 left-0 min-w-[120px] glass border border-border rounded-[var(--radius-md)] overflow-hidden shadow-lg py-1">
          <button
            onClick={() => handleSelect(null)}
            className="w-full text-left px-3 py-1.5 text-xs text-text-2 hover:bg-surface transition-colors"
          >
            (none)
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
  const router = useRouter();
  const [data, setData] = useState<NewsletterResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [langFilter, setLangFilter] = useState<LangFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [exportOpen, setExportOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const limit = 50;

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; text: string } | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (langFilter !== 'all') params.set('lang', langFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    fetch(`/api/newsletter/subscribers?${params}`)
      .then((r) => r.json())
      .then((d: NewsletterResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, debouncedSearch, langFilter, statusFilter]);

  const loadStats = useCallback(() => {
    fetch('/api/newsletter/stats')
      .then((r) => r.json())
      .then((d: StatsResponse) => setStats(d))
      .catch(() => {});
  }, []);

  // Fetch on filter changes; the loading flag is part of that fetch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadStats(); }, [loadStats]);

  const handleExport = (filter: LangFilter) => {
    const params = filter !== 'all' ? `?lang=${filter}` : '';
    window.open(`/api/newsletter/export${params}`, '_blank');
    setExportOpen(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/newsletter/subscribers/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 207) {
      if (res.status === 207) {
        const d = (await res.json()) as { message?: string };
        window.alert(d.message ?? 'Deleted here only.');
      }
      setData((prev) => prev ? { ...prev, subscribers: prev.subscribers.filter((s) => s._id !== id), total: prev.total - 1 } : null);
      void loadStats();
    }
  };

  const handleSubscriberUpdate = (updated: Subscriber) => {
    setData((prev) => prev ? { ...prev, subscribers: prev.subscribers.map((s) => (s._id === updated._id ? updated : s)) } : null);
    void loadStats();
  };

  const handleCSVImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const rows = parseCsv(await file.text());
      const header = rows[0]?.map((c) => c.toLowerCase()) ?? [];
      const hasHeader = header.some((c) => c.includes('email'));
      const emailCol = hasHeader ? Math.max(0, header.findIndex((c) => c.includes('email'))) : 0;
      const langCol = hasHeader ? header.findIndex((c) => c.includes('lang')) : 1;
      const entries = (hasHeader ? rows.slice(1) : rows)
        .map((r) => {
          const lang = langCol >= 0 ? r[langCol]?.toLowerCase() : undefined;
          return { email: r[emailCol] ?? '', preferredLanguage: lang && ['ar', 'en', 'fr'].includes(lang) ? lang : undefined };
        })
        .filter((e) => e.email);
      if (entries.length === 0) throw new Error('No email column found in this file.');
      if (entries.length > MAX_IMPORT) throw new Error(`This file has ${entries.length} rows; import at most ${MAX_IMPORT} at a time.`);
      if (!window.confirm(`Import ${entries.length} people? Only import people who agreed to receive this newsletter. They join without a confirmation email.`)) return;
      const res = await fetch('/api/newsletter/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const result = (await res.json()) as { imported?: number; skipped?: number; invalid?: number; error?: string };
      if (!res.ok) throw new Error(result.error ?? 'Import failed');
      setImportResult({
        ok: true,
        text: `Imported ${result.imported ?? 0}. ${result.skipped ?? 0} already on the list${result.invalid ? `, ${result.invalid} invalid` : ''}. Open the setup checklist and press Sync to Resend.`,
      });
      void load();
      void loadStats();
    } catch (err) {
      setImportResult({ ok: false, text: err instanceof Error ? err.message : 'Import failed' });
    } finally {
      setImporting(false);
      if (csvRef.current) csvRef.current.value = '';
    }
  };

  const newCampaign = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/newsletter/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = (await res.json()) as { id?: string };
      if (d.id) router.push(`/rk-studio/newsletter/campaigns/${d.id}`);
    } finally {
      setCreating(false);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="font-mono text-xs text-matrix tracking-[0.15em]">// email list</span>
          <h1 className="font-display font-bold text-2xl text-text-0 mt-1 flex items-center gap-2">
            Newsletter
            {stats && <span className="font-mono text-sm text-matrix">{stats.total.toLocaleString()}</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => csvRef.current?.click()} disabled={importing} className={btnGhost}>
            <Upload size={13} /> {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <div className="relative">
            <button onClick={() => setExportOpen((o) => !o)} className={btnGhost}>
              <Download size={13} /> Export CSV <ChevronDown size={12} />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[180px] glass border border-border rounded-[var(--radius-md)] overflow-hidden shadow-lg">
                  {(['all', 'en', 'fr', 'ar'] as LangFilter[]).map((f) => (
                    <button key={f} onClick={() => handleExport(f)} className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-surface transition-colors">
                      {f === 'all' ? 'Everyone' : `${langFullLabel[f]} only`}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={() => void newCampaign()} disabled={creating} className={btnPrimary}>
            <Plus size={13} /> New campaign
          </button>
        </div>
      </div>

      <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && void handleCSVImport(e.target.files[0])} />

      {importResult && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--radius-md)] border text-sm ${importResult.ok ? 'bg-matrix/[0.08] border-matrix/30 text-text-1' : 'bg-danger/[0.06] border-danger/30 text-danger'}`}>
          <span>{importResult.text}</span>
          <button onClick={() => setImportResult(null)} className="text-text-2 hover:text-text-1"><X size={12} /></button>
        </div>
      )}

      <SetupPanel />
      <SettingsPanel />

      {stats && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 glass border border-border rounded-[var(--radius-md)]">
          {[
            ['Active', stats.total],
            ['EN', stats.byLanguage.en],
            ['FR', stats.byLanguage.fr],
            ['AR', stats.byLanguage.ar],
            ...(stats.byLanguage.unknown ? [['No language (gets EN)', stats.byLanguage.unknown] as [string, number]] : []),
            ['Pending', stats.pending],
            ['Unsubscribed', stats.unsubscribed],
          ].map(([label, n], i) => (
            <div key={String(label)} className="flex items-center gap-2">
              {i > 0 && <div className="w-px h-4 bg-border me-1" />}
              <span className="text-xs text-text-2">{label}</span>
              <span className="font-mono text-sm font-semibold text-text-0">{Number(n).toLocaleString()}</span>
            </div>
          ))}
          {stats.unsubscribed > 0 && (
            <span className="w-full text-[11px] text-text-2">
              Unsubscribed: {Object.entries(stats.unsubscribedByReason).map(([r, n]) => `${n} ${r}`).join(', ')}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {(['active', 'pending', 'unsubscribed', 'all'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${statusFilter === f ? 'bg-matrix text-bg-0 border-matrix' : 'border-border text-text-2 hover:border-border-hover'}`}
            >
              {f[0]!.toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="w-px bg-border mx-1" />
          {(['all', 'en', 'fr', 'ar'] as LangFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setLangFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${langFilter === f ? 'bg-matrix text-bg-0 border-matrix' : 'border-border text-text-2 hover:border-border-hover'}`}
            >
              {f === 'all' ? 'All languages' : langLabel[f]}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subscribers..." className={`${inputCls} pl-8`} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2 hover:text-text-1"><X size={12} /></button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-text-2 py-8">Loading...</p>
      ) : !data || data.subscribers.length === 0 ? (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-10 text-center">
          <p className="font-mono text-xs text-text-2">{debouncedSearch ? `No subscribers matching "${debouncedSearch}".` : 'Nobody here yet.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-text-2">{data.total.toLocaleString()} shown by this filter</p>
          <div className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-lg)] overflow-hidden">
            {data.subscribers.map((sub) => (
              <div key={sub._id} className="flex items-center gap-3 px-5 py-3 group">
                <span className="flex-1 text-sm text-text-1 truncate">{sub.email}</span>
                <StatusBadge s={sub} />
                {sub.source && <span className="hidden sm:inline font-mono text-[10px] text-text-2 shrink-0">{sub.source}</span>}
                <LanguageEditor subscriber={sub} onUpdate={handleSubscriberUpdate} />
                <span className="font-mono text-xs text-text-2 shrink-0">
                  {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                  <InlineDeleteConfirm label={`Erase ${sub.email} everywhere`} onConfirm={() => void handleDelete(sub._id)} />
                </span>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 glass border border-border text-sm text-text-1 rounded-[var(--radius-sm)] disabled:opacity-40">Prev</button>
              <span className="font-mono text-xs text-text-2">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 glass border border-border text-sm text-text-1 rounded-[var(--radius-sm)] disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}

      <CampaignsSection />
    </div>
  );
}
