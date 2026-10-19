'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, FlaskConical, Sparkles, CalendarClock, Trash2, Monitor, Smartphone, XCircle } from 'lucide-react';
import { renderEmail } from '@/lib/newsletter/template';
import { copyFor } from '@/lib/newsletter/copy';
import { inputCls, btnGhost, btnPrimary, LANG_LABEL, LANG_NAME, pct } from '@/components/admin/newsletter/ui';

type Lang = 'en' | 'fr' | 'ar';
const LANGS: Lang[] = ['en', 'fr', 'ar'];

interface Edition {
  lang: Lang;
  subject: string;
  previewText?: string;
  bodyHtml: string;
  status?: string;
  error?: string;
  recipientCount?: number;
  fallback?: boolean;
}
interface Campaign {
  _id: string;
  subject: string;
  status?: string;
  origin?: string;
  editions: Edition[];
  fallbackToEnglish?: boolean;
  isPublic?: boolean;
  slug?: string;
  sentAt?: string;
  scheduledAt?: string;
  recipientCount: number;
  deliveredCount?: number;
  openCount?: number;
  uniqueOpenCount?: number;
  clickCount?: number;
  uniqueClickCount?: number;
  bounceCount?: number;
  complaintCount?: number;
}
interface TopLink { _id: string; clicks: number; people: number }
type Draft = Record<Lang, { subject: string; previewText: string; bodyHtml: string }>;

const empty = (): Draft => ({
  en: { subject: '', previewText: '', bodyHtml: '' },
  fr: { subject: '', previewText: '', bodyHtml: '' },
  ar: { subject: '', previewText: '', bodyHtml: '' },
});

const hasContent = (e: { subject: string; bodyHtml: string }) => Boolean(e.subject.trim() && e.bodyHtml.replace(/<[^>]+>/g, '').trim());

export default function CampaignEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [audience, setAudience] = useState<Record<Lang, number>>({ en: 0, fr: 0, ar: 0 });
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [fallbackToEnglish, setFallback] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [slug, setSlug] = useState('');
  const [lang, setLang] = useState<Lang>('en');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [scheduleAt, setScheduleAt] = useState('');
  const [postal, setPostal] = useState('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/newsletter/campaigns/${id}`);
    if (!res.ok) { setNotFound(true); return; }
    const d = (await res.json()) as { campaign: Campaign; audience: Record<Lang, number>; topLinks: TopLink[] };
    setCampaign(d.campaign);
    setAudience(d.audience);
    setTopLinks(d.topLinks ?? []);
    const next = empty();
    for (const e of d.campaign.editions) {
      if (e.fallback) continue;
      next[e.lang] = { subject: e.subject ?? '', previewText: e.previewText ?? '', bodyHtml: e.bodyHtml ?? '' };
    }
    setDraft(next);
    setFallback(d.campaign.fallbackToEnglish !== false);
    setIsPublic(d.campaign.isPublic !== false);
    setSlug(d.campaign.slug ?? '');
    setDirty(false);
  }, [id]);

  // load() only sets state after its fetches resolve
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    fetch('/api/admin/newsletter/settings').then((r) => r.json()).then((s: { postalAddress?: string }) => setPostal(s.postalAddress ?? '')).catch(() => {});
  }, []);

  const status = campaign?.status ?? (campaign?.sentAt ? 'sent' : 'draft');
  const editable = status === 'draft' || status === 'failed';
  const sentEdition = (l: Lang) => campaign?.editions.find((e) => e.lang === l && e.status === 'sent');

  const update = (field: 'subject' | 'previewText' | 'bodyHtml', value: string) => {
    setDraft((d) => ({ ...d, [lang]: { ...d[lang], [field]: value } }));
    setDirty(true);
  };

  const save = useCallback(async (): Promise<boolean> => {
    setBusy('save');
    setMsg(null);
    try {
      const editions = LANGS.filter((l) => draft[l].subject || draft[l].bodyHtml).map((l) => ({ lang: l, ...draft[l] }));
      const res = await fetch(`/api/admin/newsletter/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editable ? { editions, fallbackToEnglish, isPublic, slug } : { isPublic, slug }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(d.error ?? 'Save failed');
      setDirty(false);
      setMsg({ ok: true, text: 'Saved.' });
      await load();
      return true;
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Save failed' });
      return false;
    } finally {
      setBusy(null);
    }
  }, [draft, editable, fallbackToEnglish, id, isPublic, load, slug]);

  const testSend = async () => {
    if (dirty && !(await save())) return;
    setBusy('test');
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang }),
      });
      const d = (await res.json()) as { to?: string; results?: { lang: string; ok: boolean; error?: string }[]; error?: string };
      if (!res.ok && !d.results) throw new Error(d.error ?? 'Test send failed');
      const bad = d.results?.filter((r) => !r.ok) ?? [];
      setMsg(bad.length ? { ok: false, text: `Test failed: ${bad.map((b) => `${b.lang}: ${b.error}`).join('; ')}` } : { ok: true, text: `Test sent to ${d.to}.` });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Test send failed' });
    } finally {
      setBusy(null);
    }
  };

  const plan = useMemo(
    () =>
      LANGS.map((l) => {
        const own = hasContent(draft[l]);
        const via = own ? l : l !== 'en' && fallbackToEnglish && hasContent(draft.en) ? 'en' : null;
        return { lang: l, people: audience[l], via, done: Boolean(sentEdition(l)) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, fallbackToEnglish, audience, campaign]
  );

  const send = async (scheduled: boolean) => {
    if (dirty && !(await save())) return;
    const when = scheduled && scheduleAt ? new Date(scheduleAt) : undefined;
    if (scheduled && (!when || Number.isNaN(when.getTime()))) {
      setMsg({ ok: false, text: 'Pick a date and time first.' });
      return;
    }
    const lines = plan
      .filter((p) => !p.done)
      .map((p) => `${LANG_NAME[p.lang]}: ${p.people} people ${p.via ? (p.via === p.lang ? 'get the ' + LANG_NAME[p.lang] + ' edition' : 'get the English edition') : 'get nothing'}`);
    if (!window.confirm(`${scheduled ? `Schedule for ${when!.toLocaleString()}` : 'Send now'}?\n\n${lines.join('\n')}\n\nThis cannot be undone${scheduled ? ' after it goes out' : ''}.`)) return;
    setBusy('send');
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(when ? { scheduledAt: when.toISOString() } : {}),
      });
      const d = (await res.json()) as { error?: string; status?: string; recipients?: number };
      if (!res.ok) throw new Error(d.error ?? 'Send failed');
      setMsg({ ok: d.status !== 'failed', text: d.status === 'failed' ? 'Some editions failed. See the errors below and press Send again to retry them.' : d.status === 'scheduled' ? `Scheduled for ${d.recipients} people.` : `Sent to ${d.recipients} people.` });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Send failed' });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel this scheduled send and go back to a draft?')) return;
    setBusy('cancel');
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${id}/cancel`, { method: 'POST' });
      const d = (await res.json()) as { error?: string };
      setMsg(res.ok ? { ok: true, text: 'Schedule cancelled. Back to draft.' } : { ok: false, text: d.error ?? 'Cancel failed' });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this draft?')) return;
    const res = await fetch(`/api/admin/newsletter/campaigns/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/rk-studio/newsletter');
  };

  const aiDraft = async () => {
    if ((draft[lang].bodyHtml || draft[lang].subject) && !window.confirm(`Replace the ${LANG_NAME[lang]} edition with an AI draft from your latest ${LANG_NAME[lang]} posts?`)) return;
    setBusy('ai');
    setMsg(null);
    try {
      const res = await fetch('/api/admin/ai/newsletter-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      });
      const d = (await res.json()) as { draft?: { subject: string; previewText: string; htmlBody: string }; error?: string };
      if (!res.ok || !d.draft) throw new Error(d.error ?? 'AI draft failed');
      setDraft((cur) => ({ ...cur, [lang]: { subject: d.draft!.subject, previewText: d.draft!.previewText, bodyHtml: d.draft!.htmlBody } }));
      setDirty(true);
      setMsg({ ok: true, text: 'AI draft inserted. Review it, then save.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'AI draft failed' });
    } finally {
      setBusy(null);
    }
  };

  const preview = useMemo(() => {
    const e = draft[lang];
    const c = copyFor(lang);
    return renderEmail({
      lang,
      subject: e.subject || '(no subject)',
      preheader: e.previewText,
      bodyHtml: e.bodyHtml || '<p style="opacity:.5">Your email body appears here.</p>',
      footer: {
        reason: c.footer.reason,
        unsubscribeLabel: c.footer.unsubscribe,
        unsubscribeUrl: '#',
        manageLabel: c.footer.manage,
        manageUrl: '#',
        postalAddress: postal || '[postal address missing: add it in Newsletter settings]',
      },
      siteUrl: 'https://ketami.net',
    });
  }, [draft, lang, postal]);

  if (notFound) return <p className="text-sm text-text-2">Campaign not found. <Link href="/rk-studio/newsletter" className="underline">Back</Link></p>;
  if (!campaign) return <p className="font-mono text-xs text-text-2 py-8">Loading...</p>;

  const cur = draft[lang];
  const reached = campaign.recipientCount;

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/rk-studio/newsletter" className="inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-text-0"><ArrowLeft size={13} /> Newsletter</Link>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-text-1">{status}</span>
        {campaign.origin === 'digest' && <span className="text-[10px] font-mono text-text-2">weekly digest draft</span>}
        {dirty && <span className="text-[10px] font-mono text-warning">unsaved changes</span>}
      </div>
      <h1 className="font-display font-bold text-2xl text-text-0">{campaign.subject || 'Untitled issue'}</h1>

      {msg && <p className={`text-sm ${msg.ok ? 'text-matrix' : 'text-danger'}`}>{msg.text}</p>}

      {!editable && (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Recipients', reached],
              ['Delivered', campaign.deliveredCount ?? 0],
              ['Clicked', `${campaign.uniqueClickCount ?? 0} (${pct(campaign.uniqueClickCount, reached)})`],
              ['Opened*', `${campaign.uniqueOpenCount ?? 0} (${pct(campaign.uniqueOpenCount, reached)})`],
              ['Bounced', campaign.bounceCount ?? 0],
              ['Spam reports', campaign.complaintCount ?? 0],
              ['Total clicks', campaign.clickCount ?? 0],
              [status === 'scheduled' ? 'Goes out' : 'Sent', campaign.scheduledAt ?? campaign.sentAt ? new Date((campaign.scheduledAt ?? campaign.sentAt)!).toLocaleString() : '-'],
            ].map(([k, v]) => (
              <div key={String(k)} className="bg-surface rounded-[var(--radius-md)] p-3">
                <p className="text-[11px] text-text-2">{k}</p>
                <p className="font-mono text-sm text-text-0">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-2">*Apple Mail pre-loads images, so opens run high. Judge issues on clicks.</p>
          {topLinks.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-text-0">Top links</p>
              {topLinks.map((l) => (
                <div key={l._id} className="flex justify-between gap-3 text-xs">
                  <span className="truncate text-text-1">{l._id}</span>
                  <span className="shrink-0 font-mono text-text-2">{l.people} people, {l.clicks} clicks</span>
                </div>
              ))}
            </div>
          )}
          {status === 'scheduled' && (
            <button onClick={() => void cancel()} disabled={busy !== null} className={`${btnGhost} w-fit`}><XCircle size={13} /> Cancel schedule</button>
          )}
        </div>
      )}

      {campaign.editions.some((e) => e.status === 'failed') && (
        <div className="rounded-[var(--radius-md)] border border-danger/30 bg-danger/[0.05] px-4 py-3 text-sm text-danger">
          {campaign.editions.filter((e) => e.status === 'failed').map((e) => (
            <p key={e.lang}>{LANG_NAME[e.lang]}: {e.error}</p>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex gap-1">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${lang === l ? 'bg-matrix text-bg-0 border-matrix' : 'border-border text-text-2 hover:border-border-hover'}`}
              >
                {LANG_LABEL[l]} {hasContent(draft[l]) ? '●' : ''} <span className="opacity-70">({audience[l]})</span>
                {sentEdition(l) ? ' ✓' : ''}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-text-2 mb-1.5">Subject ({LANG_NAME[lang]})</label>
            <input value={cur.subject} onChange={(e) => update('subject', e.target.value)} disabled={!editable} maxLength={200} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-2 mb-1.5">Preview text (shown after the subject in the inbox)</label>
            <input value={cur.previewText} onChange={(e) => update('previewText', e.target.value)} disabled={!editable} maxLength={200} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={inputCls} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-text-2">Body (HTML: p, h2, h3, ul, li, a, strong, em, img, blockquote)</label>
              {editable && (
                <button onClick={() => void aiDraft()} disabled={busy !== null} className="inline-flex items-center gap-1 text-xs text-matrix hover:underline disabled:opacity-40">
                  <Sparkles size={12} /> {busy === 'ai' ? 'Drafting...' : 'AI draft from latest posts'}
                </button>
              )}
            </div>
            <textarea
              value={cur.bodyHtml}
              onChange={(e) => update('bodyHtml', e.target.value)}
              disabled={!editable}
              rows={16}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              placeholder="<p>Hello,</p><p>This week...</p>"
              className={`${inputCls} resize-y font-mono text-xs`}
            />
          </div>

          <div className="flex flex-col gap-2 text-sm text-text-1">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={fallbackToEnglish} disabled={!editable} onChange={(e) => { setFallback(e.target.checked); setDirty(true); }} className="accent-[#00CD29]" />
              Languages without their own edition get the English one
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isPublic} onChange={(e) => { setIsPublic(e.target.checked); setDirty(true); }} className="accent-[#00CD29]" />
              Publish in the public archive (ketami.net/{lang}/newsletter)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-2 shrink-0">Archive address</span>
              <input value={slug} onChange={(e) => { setSlug(e.target.value); setDirty(true); }} placeholder="made from the subject when sent" className={inputCls} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <button onClick={() => void save()} disabled={busy !== null || !dirty} className={btnGhost}><Save size={13} /> {busy === 'save' ? 'Saving...' : 'Save'}</button>
            {editable && (
              <>
                <button onClick={() => void testSend()} disabled={busy !== null || !hasContent(cur)} className={btnGhost}><FlaskConical size={13} /> {busy === 'test' ? 'Sending test...' : `Test ${LANG_LABEL[lang]} to me`}</button>
                <button onClick={() => void send(false)} disabled={busy !== null} className={btnPrimary}><Send size={13} /> {busy === 'send' ? 'Sending...' : status === 'failed' ? 'Retry failed editions' : 'Send now'}</button>
                <div className="flex items-center gap-2">
                  <input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className={`${inputCls} w-auto`} />
                  <button onClick={() => void send(true)} disabled={busy !== null || !scheduleAt} className={btnGhost}><CalendarClock size={13} /> Schedule</button>
                </div>
                {status === 'draft' && <button onClick={() => void remove()} className="ms-auto inline-flex items-center gap-1 text-xs text-text-2 hover:text-danger"><Trash2 size={12} /> Delete draft</button>}
              </>
            )}
          </div>

          {editable && (
            <div className="rounded-[var(--radius-md)] border border-border px-4 py-3 text-xs text-text-2 flex flex-col gap-1">
              <p className="font-semibold text-text-1">Who gets what</p>
              {plan.map((p) => (
                <p key={p.lang}>
                  {LANG_NAME[p.lang]} ({p.people}{p.lang === 'en' ? ', includes people with no language' : ''}):{' '}
                  {p.done ? 'already sent' : p.via ? (p.via === p.lang ? `${LANG_NAME[p.lang]} edition` : 'English edition') : 'nothing'}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-text-2">
            <span>Preview ({LANG_NAME[lang]})</span>
            <button onClick={() => setDevice('desktop')} className={`p-1 rounded ${device === 'desktop' ? 'text-matrix' : ''}`} aria-label="Desktop width"><Monitor size={13} /></button>
            <button onClick={() => setDevice('mobile')} className={`p-1 rounded ${device === 'mobile' ? 'text-matrix' : ''}`} aria-label="Phone width"><Smartphone size={13} /></button>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-[#F4F4EF] overflow-hidden flex justify-center">
            <iframe title="Email preview" sandbox="" srcDoc={preview} className="h-[760px] bg-white" style={{ width: device === 'mobile' ? 375 : '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
