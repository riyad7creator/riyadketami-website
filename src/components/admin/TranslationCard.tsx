'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, AlertTriangle, XCircle, Edit3, RefreshCw, ExternalLink, Loader2, ChevronDown, ChevronUp, Save } from 'lucide-react';

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { ssr: false });

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface TranslationInfo {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  language: 'fr' | 'ar';
  translated_at: string | null;
  updatedAt: string;
  manually_edited: boolean;
}

interface EnPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  updatedAt: string;
}

interface TranslationCardProps {
  lang: 'fr' | 'ar';
  enPost: EnPost;
  translation: TranslationInfo | null;
  onRefresh: () => void;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const LANG_META = {
  fr: { flag: '🇫🇷', label: 'French', dir: 'ltr' as const },
  ar: { flag: '🇸🇦', label: 'Arabic', dir: 'rtl' as const },
};

type Status = 'not-translated' | 'translated' | 'modified' | 'manual';

function getStatus(translation: TranslationInfo | null, enUpdatedAt: string): Status {
  if (!translation) return 'not-translated';
  if (translation.manually_edited) return 'manual';
  if (translation.translated_at && new Date(enUpdatedAt) > new Date(translation.translated_at)) {
    return 'modified';
  }
  return 'translated';
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { icon: React.ReactNode; label: string; cls: string }> = {
    'translated':      { icon: <CheckCircle2 size={11} />, label: 'TRANSLATED',           cls: 'text-matrix border-matrix/30 bg-matrix/[0.08]' },
    'modified':        { icon: <AlertTriangle size={11} />, label: 'MODIFIED — RETRANSLATE?', cls: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/[0.06]' },
    'not-translated':  { icon: <XCircle size={11} />,      label: 'NOT TRANSLATED',       cls: 'text-danger border-danger/30 bg-danger/[0.06]' },
    'manual':          { icon: <Edit3 size={11} />,         label: 'MANUAL EDITS',         cls: 'text-orange-400 border-orange-400/30 bg-orange-400/[0.06]' },
  };
  const { icon, label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] border rounded-full px-2 py-0.5 ${cls}`}>
      {icon} {label}
    </span>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function TranslationCard({ lang, enPost, translation, onRefresh }: TranslationCardProps) {
  const meta = LANG_META[lang];
  const status = getStatus(translation, enPost.updatedAt);

  // Panel state: closed | preview (unsaved new translation) | editing (existing)
  const [panelState, setPanelState] = useState<'closed' | 'preview' | 'editing'>('closed');
  const [previewData, setPreviewData] = useState<{ title: string; excerpt: string; content: string } | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editContent, setEditContent] = useState('');

  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [error, setError] = useState('');
  const [confirmRegen, setConfirmRegen] = useState(false);

  // Synced scrolling refs
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const syncLeft = useCallback(() => {
    if (syncingRef.current || !leftRef.current || !rightRef.current) return;
    syncingRef.current = true;
    const { scrollTop, scrollHeight, clientHeight } = leftRef.current;
    const ratio = scrollTop / Math.max(1, scrollHeight - clientHeight);
    rightRef.current.scrollTop = ratio * Math.max(1, rightRef.current.scrollHeight - rightRef.current.clientHeight);
    syncingRef.current = false;
  }, []);

  const syncRight = useCallback(() => {
    if (syncingRef.current || !leftRef.current || !rightRef.current) return;
    syncingRef.current = true;
    const { scrollTop, scrollHeight, clientHeight } = rightRef.current;
    const ratio = scrollTop / Math.max(1, scrollHeight - clientHeight);
    leftRef.current.scrollTop = ratio * Math.max(1, leftRef.current.scrollHeight - leftRef.current.clientHeight);
    syncingRef.current = false;
  }, []);

  /* ── Translate now ─────────────────────────────────────────────────────── */
  const handleTranslateNow = async () => {
    setTranslating(true);
    setError('');
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: enPost.content,
          targetLanguage: lang,
          title: enPost.title,
          excerpt: enPost.excerpt,
        }),
      });
      const data = await res.json() as { title?: string; excerpt?: string; content?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'Translation failed.');
      } else {
        const preview = {
          title: data.title ?? '',
          excerpt: data.excerpt ?? '',
          content: data.content ?? '',
        };
        setPreviewData(preview);
        setPanelState('preview');
      }
    } catch {
      setError('Network error during translation.');
    } finally {
      setTranslating(false);
    }
  };

  /* ── Open edit panel ───────────────────────────────────────────────────── */
  const openEdit = () => {
    if (!translation) return;
    setEditTitle(translation.title);
    setEditExcerpt(translation.excerpt);
    setEditContent(translation.content);
    setSaveOk(false);
    setError('');
    setPanelState('editing');
  };

  /* ── Save preview (first-time translation) ─────────────────────────────── */
  const savePreview = async (editFirst = false) => {
    if (!previewData) return;
    if (editFirst) {
      setEditTitle(previewData.title);
      setEditExcerpt(previewData.excerpt);
      setEditContent(previewData.content);
      setPreviewData(null);
      setPanelState('editing');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/translate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: enPost._id, lang, data: previewData }),
      });
      if (res.ok) {
        setSaveOk(true);
        setPreviewData(null);
        setPanelState('closed');
        onRefresh();
      } else {
        const err = await res.json() as { error?: string };
        setError(err.error ?? 'Save failed.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Save manual edits ─────────────────────────────────────────────────── */
  const saveEdits = async () => {
    if (!translation) return;
    setSaving(true);
    setSaveOk(false);
    setError('');
    try {
      const res = await fetch(`/api/admin/translate-post/${translation._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, excerpt: editExcerpt, content: editContent }),
      });
      if (res.ok) {
        setSaveOk(true);
        setTimeout(() => setSaveOk(false), 3000);
        onRefresh();
      } else {
        const err = await res.json() as { error?: string };
        setError(err.error ?? 'Save failed.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Regenerate ────────────────────────────────────────────────────────── */
  const handleRegenerate = async () => {
    setConfirmRegen(false);
    setTranslating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/translate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: enPost._id, langs: [lang] }),
      });
      const data = await res.json() as Record<string, { status: string; error?: string }>;
      if (data[lang]?.status === 'ok') {
        onRefresh();
        setPanelState('closed');
      } else {
        setError(data[lang]?.error ?? 'Regeneration failed.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setTranslating(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────── */
  const panelOpen = panelState !== 'closed';
  const activeData = panelState === 'preview' ? previewData : (panelState === 'editing' ? { title: editTitle, excerpt: editExcerpt, content: editContent } : null);

  return (
    <div className="flex flex-col border border-border rounded-[var(--radius-lg)] overflow-hidden">
      {/* Card header ─────────────────────────────────────────────────────── */}
      <div className={`flex items-start justify-between gap-4 p-4 ${panelOpen ? 'border-b border-border bg-bg-1/40' : ''}`}>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <span className="text-base">{meta.flag}</span>
            <span className="font-medium text-sm text-text-0">{meta.label}</span>
            <StatusBadge status={status} />
          </div>
          {translation?.translated_at && (
            <p className="font-mono text-[10px] text-text-2">
              Last updated: {new Date(translation.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
          {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {status === 'not-translated' ? (
            <button
              type="button"
              onClick={() => void handleTranslateNow()}
              disabled={translating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-matrix text-bg-0 text-xs font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
            >
              {translating ? <><Loader2 size={11} className="animate-spin" /> Translating...</> : 'Translate now with AI →'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={panelOpen ? () => setPanelState('closed') : openEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 glass border border-border text-text-1 text-xs rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
              >
                {panelOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                {panelOpen ? 'Close' : `Edit ${meta.label}`}
              </button>

              {/* Regenerate */}
              {confirmRegen ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-text-2">Overwrite edits?</span>
                  <button
                    onClick={() => void handleRegenerate()}
                    disabled={translating}
                    className="text-[10px] px-2 py-1 bg-danger/80 text-white rounded-[var(--radius-sm)] hover:bg-danger disabled:opacity-40"
                  >
                    {translating ? '...' : 'Yes, regenerate'}
                  </button>
                  <button onClick={() => setConfirmRegen(false)} className="text-[10px] text-text-2 hover:text-text-1">Cancel</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmRegen(true)}
                  disabled={translating}
                  className="p-1.5 text-text-2 hover:text-text-1 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
                  title="Regenerate translation"
                >
                  <RefreshCw size={13} />
                </button>
              )}

              {/* Preview */}
              {translation && (
                <a
                  href={`/${lang}/blog/${translation.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-text-2 hover:text-matrix transition-colors duration-[var(--duration-fast)]"
                  title="Preview in new tab"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* Translating progress bar ────────────────────────────────────────── */}
      {translating && (
        <div className="px-4 py-3 bg-bg-1/40 border-b border-border">
          <div className="flex items-center gap-2">
            <Loader2 size={12} className="text-matrix animate-spin shrink-0" />
            <span className="font-mono text-xs text-text-2">Translating with Gemini Flash 2.5...</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-matrix/60 animate-pulse rounded-full" style={{ width: '65%' }} />
          </div>
        </div>
      )}

      {/* Review panel ───────────────────────────────────────────────────── */}
      {panelOpen && activeData && (
        <div className="flex flex-col">
          {/* Panel header */}
          <div className="flex items-center justify-between gap-4 px-4 py-2.5 bg-bg-1/60 border-b border-border">
            <span className="font-mono text-[10px] text-text-2">
              {translation?.translated_at
                ? `Translated with Gemini Flash 2.5 on ${new Date(translation.translated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                : 'Preview — not saved yet'}
            </span>

            {panelState === 'editing' && (
              <button
                type="button"
                onClick={() => void saveEdits()}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-matrix text-bg-0 text-xs font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
              >
                {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                {saving ? 'Saving...' : saveOk ? '✓ Saved' : 'Save changes'}
              </button>
            )}

            {panelState === 'preview' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void savePreview(false)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-matrix text-bg-0 text-xs font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40"
                >
                  {saving ? '...' : 'Looks good, save'}
                </button>
                <button
                  type="button"
                  onClick={() => void savePreview(true)}
                  className="px-3 py-1.5 glass border border-border text-text-1 text-xs rounded-[var(--radius-md)] hover:border-border-hover"
                >
                  Edit before saving
                </button>
              </div>
            )}
          </div>

          {/* Title + Excerpt comparison */}
          <div className="grid grid-cols-2 gap-0 border-b border-border">
            {/* EN side */}
            <div className="px-4 py-3 border-r border-border flex flex-col gap-2">
              <span className="font-mono text-[10px] text-text-2 tracking-widest uppercase">EN — Original</span>
              <p className="text-sm font-semibold text-text-0">{enPost.title}</p>
              {enPost.excerpt && <p className="text-xs text-text-2 leading-relaxed">{enPost.excerpt}</p>}
            </div>
            {/* Translation side */}
            <div className={`px-4 py-3 flex flex-col gap-2 bg-bg-1/30`} dir={meta.dir}>
              <span className="font-mono text-[10px] text-text-2 tracking-widest uppercase">{meta.flag} {lang.toUpperCase()} — Translation</span>
              {panelState === 'editing' ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-bg-1 border border-border rounded-[var(--radius-sm)] px-2 py-1 text-sm text-text-0 focus:outline-none focus:border-matrix/50"
                  />
                  <textarea
                    value={editExcerpt}
                    onChange={(e) => setEditExcerpt(e.target.value)}
                    rows={2}
                    className="w-full bg-bg-1 border border-border rounded-[var(--radius-sm)] px-2 py-1 text-xs text-text-1 focus:outline-none focus:border-matrix/50 resize-none"
                  />
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-text-0">{activeData.title}</p>
                  {activeData.excerpt && <p className="text-xs text-text-2 leading-relaxed">{activeData.excerpt}</p>}
                </>
              )}
            </div>
          </div>

          {/* Side-by-side content */}
          <div className="grid grid-cols-2" style={{ height: '420px' }}>
            {/* EN column (read-only) */}
            <div
              ref={leftRef}
              onScroll={syncLeft}
              className="overflow-y-auto border-r border-border px-4 py-3 prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-text-0 prose-p:text-text-1 prose-a:text-matrix prose-code:text-matrix"
              dangerouslySetInnerHTML={{ __html: enPost.content }}
            />

            {/* Translation column */}
            <div
              ref={rightRef}
              onScroll={syncRight}
              className="overflow-y-auto bg-bg-1/30"
              dir={meta.dir}
            >
              {panelState === 'editing' ? (
                <TiptapEditor
                  content={editContent}
                  onChange={setEditContent}
                  placeholder="Edit translation..."
                />
              ) : (
                <div
                  className="px-4 py-3 prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-text-0 prose-p:text-text-1 prose-a:text-matrix prose-code:text-matrix"
                  dangerouslySetInnerHTML={{ __html: activeData.content }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
