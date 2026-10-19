'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { btnGhost } from './ui';

interface Status {
  resendKey: boolean;
  from: string;
  dedicatedSender: boolean;
  webhookSecret: boolean;
  linkSecret: boolean;
  cronSecret: boolean;
  turnstile: boolean;
  upstash: boolean;
  kitMirror: boolean;
  postalAddress: boolean;
  segments: string | null;
  unsynced: number;
  active: number;
}

/** What is configured for sending, and what still needs doing */
export default function SetupPanel() {
  const [s, setS] = useState<Status | null>(null);
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/newsletter/sync');
      if (res.ok) setS((await res.json()) as Status);
    } catch {
      // keep the last state
    }
  }, []);
  // load() only sets state after its fetch resolves
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function sync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      for (let round = 0; round < 20; round++) {
        const res = await fetch('/api/admin/newsletter/sync', { method: 'POST' });
        const d = (await res.json()) as { synced?: number; failed?: number; remaining?: number; error?: string };
        if (!res.ok) throw new Error(d.error ?? 'Sync failed');
        setSyncMsg(`${d.synced ?? 0} synced${d.failed ? `, ${d.failed} failed` : ''}, ${d.remaining ?? 0} left`);
        if (!d.remaining || (d.synced ?? 0) === 0) break;
      }
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
      void load();
    }
  }

  if (!s) return null;

  const items: { ok: boolean; label: string; hint: string; optional?: boolean }[] = [
    { ok: s.resendKey, label: 'Resend API key', hint: 'Set RESEND_API_KEY on Vercel.' },
    { ok: s.dedicatedSender, label: `Sender: ${s.from}`, hint: 'Verify news.ketami.net in Resend (SPF, DKIM, DMARC in Infomaniak DNS), then set NEWSLETTER_FROM_EMAIL.' },
    { ok: s.postalAddress, label: 'Postal address in the footer', hint: 'Add it in Settings below. Sending is blocked without it.' },
    { ok: s.webhookSecret, label: 'Bounce, complaint and click webhook', hint: 'Resend > Webhooks: point to /api/newsletter/webhooks/resend, then set RESEND_WEBHOOK_SECRET.' },
    { ok: s.linkSecret, label: 'Dedicated link secret', hint: 'Set NEWSLETTER_UNSUB_SECRET (a long random string).' },
    { ok: s.cronSecret, label: 'Daily job (welcome series, digest, cleanup)', hint: 'Set CRON_SECRET on Vercel; vercel.json schedules it.' },
    { ok: s.segments === 'ok', label: 'Language segments in Resend', hint: s.segments && s.segments !== 'ok' ? s.segments : 'Created automatically once the API key works.' },
    { ok: s.unsynced === 0, label: s.unsynced === 0 ? 'All subscribers synced to Resend' : `${s.unsynced} subscribers not synced to Resend`, hint: 'Press Sync to Resend.' },
    { ok: s.upstash, label: 'Shared rate limits (Upstash)', hint: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.', optional: true },
    { ok: s.turnstile, label: 'Turnstile bot check on the form', hint: 'Set NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.', optional: true },
  ];
  const missing = items.filter((i) => !i.ok && !i.optional).length;

  return (
    <div className="glass border border-border rounded-[var(--radius-lg)]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        {missing === 0 ? <CheckCircle2 size={15} className="text-matrix" /> : <AlertTriangle size={15} className="text-warning" />}
        <span className="text-sm font-medium text-text-0">Setup checklist</span>
        <span className="text-xs text-text-2">{missing === 0 ? 'ready to send' : `${missing} to do`}</span>
        <span className="ms-auto text-text-2">{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
          <ul className="flex flex-col gap-2">
            {items.map((i) => (
              <li key={i.label} className="flex items-start gap-2 text-sm">
                {i.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-matrix" /> : <AlertTriangle size={14} className={`mt-0.5 shrink-0 ${i.optional ? 'text-text-2' : 'text-warning'}`} />}
                <span>
                  <span className="text-text-0">{i.label}</span>
                  {i.optional && <span className="ms-1 text-[10px] uppercase tracking-wider text-text-2">optional</span>}
                  {!i.ok && <span className="block text-xs text-text-2">{i.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <button onClick={() => void sync()} disabled={syncing || !s.resendKey} className={btnGhost}>
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing...' : 'Sync to Resend'}
            </button>
            {syncMsg && <span className="text-xs text-text-2">{syncMsg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
