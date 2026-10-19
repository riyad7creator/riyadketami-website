'use client';

import { useCallback, useEffect, useState } from 'react';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { inputCls, btnPrimary, LANG_NAME } from './ui';

type Lang = 'en' | 'fr' | 'ar';
interface NlSettings {
  postalAddress: string;
  replyTo: string;
  leadMagnet: Partial<Record<Lang, { title: string; url: string }>>;
  archiveByDefault: boolean;
}

export default function SettingsPanel() {
  const [s, setS] = useState<NlSettings | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/newsletter/settings');
    if (res.ok) setS((await res.json()) as NlSettings);
  }, []);
  // load() only sets state after its fetch resolves
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load().catch(() => {}); }, [load]);

  async function save() {
    if (!s) return;
    setSaving(true);
    setMsg('');
    try {
      const leadMagnet = Object.fromEntries(
        (['en', 'fr', 'ar'] as Lang[]).map((l) => [l, { title: s.leadMagnet[l]?.title ?? '', url: s.leadMagnet[l]?.url ?? '' }])
      );
      const res = await fetch('/api/admin/newsletter/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, leadMagnet }),
      });
      const d = (await res.json()) as { error?: string; path?: (string | number)[] };
      setMsg(res.ok ? 'Saved.' : `${d.error ?? 'Save failed'}${d.path?.length ? ` (${d.path.join('.')})` : ''}`);
    } catch {
      setMsg('Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!s) return null;
  const setMagnet = (l: Lang, k: 'title' | 'url', v: string) =>
    setS({ ...s, leadMagnet: { ...s.leadMagnet, [l]: { title: s.leadMagnet[l]?.title ?? '', url: s.leadMagnet[l]?.url ?? '', [k]: v } } });

  return (
    <div className="glass border border-border rounded-[var(--radius-lg)]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <Settings2 size={15} className="text-matrix" />
        <span className="text-sm font-medium text-text-0">Settings</span>
        <span className="text-xs text-text-2">footer address, replies, free resource</span>
        <span className="ms-auto text-text-2">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-2">Postal address (printed in every email footer)</label>
            <input value={s.postalAddress} onChange={(e) => setS({ ...s, postalAddress: e.target.value })} placeholder="Business address or PO box, not your home" className={inputCls} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-2">Reply-to address</label>
            <input value={s.replyTo} onChange={(e) => setS({ ...s, replyTo: e.target.value })} className={inputCls} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-text-2">Free resource for new subscribers (shown on /subscribe and in the first welcome email)</span>
            {(['en', 'fr', 'ar'] as Lang[]).map((l) => (
              <div key={l} className="grid gap-2 sm:grid-cols-[70px_1fr_1fr] sm:items-center">
                <span className="text-xs text-text-1">{LANG_NAME[l]}</span>
                <input value={s.leadMagnet[l]?.title ?? ''} onChange={(e) => setMagnet(l, 'title', e.target.value)} placeholder="Title" className={inputCls} dir={l === 'ar' ? 'rtl' : 'ltr'} />
                <input value={s.leadMagnet[l]?.url ?? ''} onChange={(e) => setMagnet(l, 'url', e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-text-1">
            <input type="checkbox" checked={s.archiveByDefault} onChange={(e) => setS({ ...s, archiveByDefault: e.target.checked })} className="accent-[#00CD29]" />
            Publish new issues in the public archive by default
          </label>
          <div className="flex items-center gap-3">
            <button onClick={() => void save()} disabled={saving} className={btnPrimary}>{saving ? 'Saving...' : 'Save settings'}</button>
            {msg && <span className="text-xs text-text-2">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
