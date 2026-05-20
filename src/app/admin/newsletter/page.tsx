'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Download, Upload, Send, Search, X } from 'lucide-react';
import InlineDeleteConfirm from '@/components/admin/InlineDeleteConfirm';

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
}

interface NewsletterResponse {
  subscribers: Subscriber[];
  total: number;
}

const inputCls = 'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors duration-[var(--duration-fast)]';

export default function AdminNewsletterPage() {
  const [data, setData] = useState<NewsletterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
    fetch(`/api/newsletter/subscribers?${params}`)
      .then((r) => r.json())
      .then((d: NewsletterResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, debouncedSearch]);

  useEffect(() => { void load(); }, [load]);

  // Export CSV
  const handleExport = () => {
    if (!data) return;
    const csv = 'email,joined\n' + data.subscribers
      .map((s) => `${s.email},${new Date(s.createdAt).toISOString().slice(0, 10)}`)
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
    }
  };

  // Import CSV
  const handleCSVImport = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    const text = await file.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    // Strip header if it looks like a header (contains "email")
    const dataLines = lines[0]?.toLowerCase().includes('email') ? lines.slice(1) : lines;
    // Extract email from each line (CSV may have multiple columns)
    const emails = dataLines.map((line) => {
      const cols = line.split(',');
      return cols[0]?.trim().replace(/^["']|["']$/g, '') ?? '';
    }).filter(Boolean);

    const res = await fetch('/api/newsletter/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    });
    const result = await res.json() as { imported: number; skipped: number; error?: string };
    if (res.ok) {
      setImportResult({ imported: result.imported, skipped: result.skipped });
      void load();
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
          <button
            onClick={handleExport}
            disabled={!data || data.subscribers.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
          >
            <Download size={13} /> Export CSV
          </button>
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

      {/* Search */}
      <div className="relative">
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
    </div>
  );
}
