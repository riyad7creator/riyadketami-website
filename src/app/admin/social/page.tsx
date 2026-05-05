'use client';

import { useEffect, useState } from 'react';
import { Trash2, Eye, EyeOff, Check, X } from 'lucide-react';
import { SOCIAL_PLATFORMS } from '@/lib/social-platforms';

interface SocialAccount {
  _id: string;
  platform: string;
  handle: string;
  url: string;
  follower_count: number;
  visible: boolean;
  order: number;
}

interface EditingState {
  id: string;
  follower_count: string;
}

const inputCls = 'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors duration-[var(--duration-fast)]';
const labelCls = 'block text-xs font-medium text-text-2 mb-1';

export default function AdminSocialPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ platform: 'tiktok', handle: '', url: '', follower_count: '0' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/social?admin=true')
      .then((r) => r.json())
      .then((data: SocialAccount[]) => { setAccounts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const upsert = async (data: Record<string, unknown>) => {
    setSaving(true);
    setError('');
    const res = await fetch('/api/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const saved = await res.json() as SocialAccount;
      setAccounts((prev) => {
        const idx = prev.findIndex((a) => a._id === saved._id);
        return idx >= 0 ? prev.map((a, i) => (i === idx ? saved : a)) : [...prev, saved];
      });
      setSaving(false);
      return true;
    }
    const err = await res.json() as { error?: string };
    setError(err.error ?? 'Save failed.');
    setSaving(false);
    return false;
  };

  const handleAdd = async () => {
    const ok = await upsert({
      platform: form.platform,
      handle: form.handle,
      url: form.url,
      follower_count: parseInt(form.follower_count) || 0,
    });
    if (ok) { setAdding(false); setForm({ platform: 'tiktok', handle: '', url: '', follower_count: '0' }); }
  };

  const saveCount = async (account: SocialAccount, count: string) => {
    const ok = await upsert({ platform: account.platform, handle: account.handle, url: account.url, follower_count: parseInt(count) || 0 });
    if (ok) setEditing(null);
  };

  const toggleVisibility = async (account: SocialAccount) => {
    const res = await fetch('/api/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: account.platform, handle: account.handle, url: account.url, follower_count: account.follower_count, visible: !account.visible }),
    });
    if (res.ok) {
      const saved = await res.json() as SocialAccount;
      setAccounts((prev) => prev.map((a) => (a._id === saved._id ? saved : a)));
    }
  };

  const handleDelete = async (id: string, platform: string) => {
    if (!confirm(`Remove ${platform}?`)) return;
    const res = await fetch(`/api/social?id=${id}`, { method: 'DELETE' });
    if (res.ok) setAccounts((prev) => prev.filter((a) => a._id !== id));
  };

  const formatCount = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-matrix tracking-[0.15em]">// reach</span>
          <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Social accounts</h1>
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
        >
          + Add account
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-5 flex flex-col gap-4">
          <h2 className="text-sm font-medium text-text-0">New account</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                className={inputCls}
              >
                {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Handle</label>
              <input value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))} placeholder="@handle" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Profile URL</label>
              <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Follower count</label>
              <input type="number" value={form.follower_count} onChange={(e) => setForm((f) => ({ ...f, follower_count: e.target.value }))} className={inputCls} />
            </div>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setAdding(false); setError(''); }} className="px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Accounts list */}
      {loading ? (
        <p className="font-mono text-xs text-text-2 py-8">Loading...</p>
      ) : accounts.length === 0 ? (
        <p className="font-mono text-xs text-text-2 py-8">No accounts yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((account) => (
            <div
              key={account._id}
              className={`flex items-center gap-4 glass border rounded-[var(--radius-md)] px-4 py-3.5 transition-colors duration-[var(--duration-fast)] ${
                account.visible ? 'border-border' : 'border-border opacity-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-0 capitalize">{account.platform}</p>
                <p className="text-xs text-text-2 truncate">{account.handle}</p>
              </div>

              {editing?.id === account._id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editing.follower_count}
                    onChange={(e) => setEditing({ ...editing, follower_count: e.target.value })}
                    className="w-28 bg-bg-1 border border-matrix/40 rounded-[var(--radius-sm)] px-2 py-1 text-sm text-text-0 focus:outline-none"
                  />
                  <button onClick={() => saveCount(account, editing.follower_count)} disabled={saving} className="text-matrix hover:text-matrix/70 transition-colors duration-[var(--duration-fast)]">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditing(null)} className="text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)]">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing({ id: account._id, follower_count: String(account.follower_count) })}
                  className="font-mono text-sm text-matrix hover:text-matrix/70 transition-colors duration-[var(--duration-fast)] shrink-0"
                >
                  {formatCount(account.follower_count)}
                </button>
              )}

              <button onClick={() => toggleVisibility(account)} className="text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)] shrink-0" title={account.visible ? 'Hide' : 'Show'}>
                {account.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button onClick={() => handleDelete(account._id, account.platform)} className="text-text-2 hover:text-danger transition-colors duration-[var(--duration-fast)] shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
