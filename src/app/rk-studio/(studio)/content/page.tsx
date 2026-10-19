'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, ImageIcon, Link2, Loader2, Plus, RotateCcw, Save, Search, Trash2, Type,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import MediaPickerModal from '@/components/admin/MediaPickerModal';
import type { ImageSlot, ImageSlotKey, SiteImage, SiteLink } from '@/lib/site-content';

// ---------------------------------------------------------------------------
// Types (shape of GET /api/admin/site-content)
// ---------------------------------------------------------------------------

type Lang = 'en' | 'fr' | 'ar';
type ImageOverride = Pick<SiteImage, 'src'> & Partial<Pick<SiteImage, 'width' | 'height' | 'alt'>>;
type Images = Partial<Record<ImageSlotKey, ImageOverride>>;
type TextStore = Partial<Record<Lang, Record<string, string>>>;

interface ContentPayload {
  images: Images;
  text: TextStore;
  links: SiteLink[] | null;
  slots: Record<ImageSlotKey, ImageSlot>;
  defaults: { links: SiteLink[]; text: Record<Lang, Record<string, string>> };
}

type Tab = 'images' | 'texts' | 'links';

const TABS: { value: Tab; label: string; icon: typeof ImageIcon }[] = [
  { value: 'images', label: 'Images', icon: ImageIcon },
  { value: 'texts', label: 'Texts', icon: Type },
  { value: 'links', label: 'Links', icon: Link2 },
];

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'fr', label: 'FR' },
  { value: 'ar', label: 'AR' },
];

const SECTION_LABELS: Record<string, string> = {
  home: 'Home page',
  about: 'About page',
  services: 'What I do (services page)',
  contact: 'Contact page',
  blog: 'Blog',
  links_page: 'Bio page (/links)',
  nav: 'Navigation menu',
  footer: 'Footer',
  meta: 'Search engine descriptions',
};

const inputCls =
  'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2/70 focus:outline-none focus:border-matrix/50 transition-colors';
const btnPrimary =
  'flex items-center gap-1.5 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors';
const btnGhost =
  'flex items-center gap-1.5 px-3 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-matrix/50 disabled:opacity-40 transition-colors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Media library files are stored as data URLs: point the site at /media/<id>.<ext> instead */
function mediaPath(url: string, mediaId: string): string {
  if (/^https:\/\//i.test(url) || url.startsWith('/')) return url;
  const mime = /^data:([^;,]+)/.exec(url)?.[1] ?? 'image/webp';
  const sub = mime.split('/')[1] ?? 'webp';
  const ext = sub === 'svg+xml' ? 'svg' : sub === 'jpeg' ? 'jpg' : sub;
  return `/media/${mediaId}.${ext}`;
}

function measure(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      resolve(img.naturalWidth > 0 && img.naturalHeight > 0 ? { width: img.naturalWidth, height: img.naturalHeight } : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

async function fetchContent(): Promise<ContentPayload | { error: string }> {
  try {
    const res = await fetch('/api/admin/site-content');
    const json = (await res.json().catch(() => null)) as (ContentPayload & { error?: string }) | null;
    if (!res.ok || !json) return { error: json?.error ?? 'Could not load the site content' };
    return json;
  } catch {
    return { error: 'Could not load the site content' };
  }
}

async function putContent(body: Record<string, unknown>): Promise<ContentPayload | { error: string }> {
  let res: Response;
  try {
    res = await fetch('/api/admin/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { error: 'Network error: nothing was saved' };
  }
  const json = (await res.json().catch(() => ({ error: 'Save failed' }))) as ContentPayload & { error?: string };
  if (!res.ok) return { error: json.error ?? 'Save failed' };
  return json;
}

// ---------------------------------------------------------------------------
// Images tab
// ---------------------------------------------------------------------------

function ImagesTab({ data, onSaved }: { data: ContentPayload; onSaved: (d: ContentPayload) => void }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<Images>(data.images);
  const [pickerSlot, setPickerSlot] = useState<ImageSlotKey | null>(null);
  const [saving, setSaving] = useState(false);

  const slotKeys = useMemo(() => Object.keys(data.slots) as ImageSlotKey[], [data.slots]);
  const groups = useMemo(() => {
    const map = new Map<string, ImageSlotKey[]>();
    for (const key of slotKeys) {
      const section = data.slots[key].section;
      map.set(section, [...(map.get(section) ?? []), key]);
    }
    return [...map.entries()];
  }, [data.slots, slotKeys]);

  const changed = slotKeys.filter((k) => !sameJson(draft[k], data.images[k]));

  const pick = async (url: string, mediaId: string) => {
    const slot = pickerSlot;
    if (!slot) return;
    const src = mediaPath(url, mediaId);
    const size = await measure(url);
    setDraft((d) => ({
      ...d,
      [slot]: {
        src,
        ...(size ?? {}),
        alt: d[slot]?.alt ?? data.slots[slot].alt,
      },
    }));
  };

  const setAlt = (key: ImageSlotKey, alt: string) => {
    const slot = data.slots[key];
    setDraft((d) => ({
      ...d,
      [key]: { ...(d[key] ?? { src: slot.src, width: slot.width, height: slot.height }), alt },
    }));
  };

  const reset = (key: ImageSlotKey) =>
    setDraft((d) => {
      const next = { ...d };
      delete next[key];
      return next;
    });

  const save = async () => {
    if (changed.length === 0) return;
    setSaving(true);
    const images = Object.fromEntries(changed.map((k) => [k, draft[k] ?? null]));
    const result = await putContent({ images });
    setSaving(false);
    if ('error' in result) {
      toast(result.error, 'error');
      return;
    }
    onSaved(result);
    setDraft(result.images);
    toast(`Images saved (${changed.length}). The site updates on the next page load.`, 'success');
  };

  return (
    <div className="flex flex-col gap-8">
      <SaveBar count={changed.length} saving={saving} onSave={save} label="image" />

      {groups.map(([section, keys]) => (
        <section key={section} className="flex flex-col gap-3">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-2">{section}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {keys.map((key) => {
              const slot = data.slots[key];
              const override = draft[key];
              const current = override?.src ?? slot.src;
              const isChanged = changed.includes(key);
              return (
                <div
                  key={key}
                  className={`glass border rounded-[var(--radius-lg)] p-4 flex flex-col gap-3 ${
                    isChanged ? 'border-matrix/40' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-sm text-text-0">{slot.label}</h3>
                      <p className="text-xs text-text-2 mt-0.5">{slot.hint}</p>
                    </div>
                    <span
                      className={`shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                        override ? 'border-matrix/40 text-matrix' : 'border-border text-text-2'
                      }`}
                    >
                      {override ? 'custom' : 'default'}
                    </span>
                  </div>

                  <div className="relative w-full aspect-video rounded-[var(--radius-md)] border border-border bg-bg-1 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element -- preview of any source */}
                    <img src={current} alt={override?.alt ?? slot.alt} className="max-w-full max-h-full object-contain" />
                  </div>
                  <p className="font-mono text-[10px] text-text-2 truncate" title={current}>
                    {current}
                    {override?.width && override?.height ? ` · ${override.width}×${override.height}` : ''}
                  </p>

                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-text-2">Alt text (describes the image for screen readers and Google)</span>
                    <input
                      value={override?.alt ?? slot.alt}
                      onChange={(e) => setAlt(key, e.target.value)}
                      placeholder={slot.alt || 'Decorative image: leave empty'}
                      maxLength={300}
                      className={inputCls}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setPickerSlot(key)} className={btnPrimary}>
                      <ImageIcon size={13} /> Replace
                    </button>
                    {override && (
                      <button type="button" onClick={() => reset(key)} className={btnGhost}>
                        <RotateCcw size={13} /> Reset to default
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <MediaPickerModal
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        onSelect={(url, id) => void pick(url, id)}
        title={pickerSlot ? `Replace: ${data.slots[pickerSlot].label}` : 'Replace image'}
      />
    </div>
  );
}

function SaveBar({ count, saving, onSave, label }: { count: number; saving: boolean; onSave: () => void; label: string }) {
  return (
    <div className="sticky top-0 z-10 -mx-1 px-1 py-2 bg-bg-0/90 backdrop-blur flex items-center justify-between gap-3 border-b border-border">
      <span className="font-mono text-xs text-text-2">
        {count === 0 ? '// no unsaved changes' : `// ${count} unsaved ${label}${count > 1 ? 's' : ''}`}
      </span>
      <button type="button" onClick={onSave} disabled={saving || count === 0} className={btnPrimary}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Texts tab
// ---------------------------------------------------------------------------

/** "home.what_i_do.cards.0.title" to "What i do · Card 1 · Title" */
function prettyPath(path: string): string {
  const parts = path.split('.').slice(1);
  return parts
    .map((p, i) => {
      if (/^\d+$/.test(p)) {
        const parent = parts[i - 1] ?? '';
        const noun = parent === 'cards' ? 'Card' : parent === 'faq' ? 'Question' : parent === 'process' ? 'Step' : 'Item';
        return `${noun} ${Number(p) + 1}`;
      }
      const words = p.replace(/_/g, ' ');
      return words.charAt(0).toUpperCase() + words.slice(1);
    })
    .filter((p, i, arr) => !(i < arr.length - 1 && /^(Cards|Faq|Process|Items|Paragraphs)$/.test(p)))
    .join(' · ');
}

function TextsTab({ data, onSaved }: { data: ContentPayload; onSaved: (d: ContentPayload) => void }) {
  const { toast } = useToast();
  const [lang, setLang] = useState<Lang>('en');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Record<Lang, Record<string, string>>>({
    en: { ...(data.text.en ?? {}) },
    fr: { ...(data.text.fr ?? {}) },
    ar: { ...(data.text.ar ?? {}) },
  });
  const [saving, setSaving] = useState(false);

  // Fields come from en.json; a language only shows the paths its own file has
  const paths = useMemo(
    () => Object.keys(data.defaults.text.en).filter((p) => p in (data.defaults.text[lang] ?? {})),
    [data.defaults.text, lang]
  );

  const changes = useMemo(() => {
    const out: Partial<Record<Lang, Record<string, string | null>>> = {};
    let count = 0;
    for (const { value: l } of LANGS) {
      const saved = data.text[l] ?? {};
      const cur = draft[l];
      const keys = new Set([...Object.keys(saved), ...Object.keys(cur)]);
      for (const k of keys) {
        const a = (saved[k] ?? '').trim();
        const b = (cur[k] ?? '').trim();
        if (a !== b) {
          (out[l] ??= {})[k] = b === '' ? null : cur[k] ?? null;
          count++;
        }
      }
    }
    return { out, count };
  }, [data.text, draft]);

  const q = query.trim().toLowerCase();
  const defaults = data.defaults.text[lang] ?? {};
  const visible = paths.filter((p) => {
    if (!q) return true;
    return (
      p.toLowerCase().includes(q) ||
      prettyPath(p).toLowerCase().includes(q) ||
      (defaults[p] ?? '').toLowerCase().includes(q) ||
      (draft[lang][p] ?? '').toLowerCase().includes(q)
    );
  });

  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of visible) {
      const section = p.split('.')[0] ?? '';
      map.set(section, [...(map.get(section) ?? []), p]);
    }
    return [...map.entries()];
  }, [visible]);

  const setValue = (path: string, value: string) =>
    setDraft((d) => ({ ...d, [lang]: { ...d[lang], [path]: value } }));

  const resetField = (path: string) =>
    setDraft((d) => {
      const next = { ...d[lang] };
      delete next[path];
      return { ...d, [lang]: next };
    });

  const save = async () => {
    if (changes.count === 0) return;
    setSaving(true);
    const result = await putContent({ text: changes.out });
    setSaving(false);
    if ('error' in result) {
      toast(result.error, 'error');
      return;
    }
    onSaved(result);
    setDraft({
      en: { ...(result.text.en ?? {}) },
      fr: { ...(result.text.fr ?? {}) },
      ar: { ...(result.text.ar ?? {}) },
    });
    toast(`Texts saved (${changes.count}). The site updates on the next page load.`, 'success');
  };

  const rtl = lang === 'ar';
  const overriddenInLang = Object.values(draft[lang]).filter((v) => v.trim() !== '').length;

  return (
    <div className="flex flex-col gap-6">
      <SaveBar count={changes.count} saving={saving} onSave={save} label="text change" />

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex gap-1">
          {LANGS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setLang(l.value)}
              className={`px-4 py-1.5 text-xs rounded-full font-mono transition-colors ${
                lang === l.value ? 'bg-matrix text-bg-0 font-bold' : 'text-text-2 hover:text-text-1 border border-border'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields or text..."
            className={`${inputCls} pl-8`}
          />
        </div>
      </div>
      <p className="text-xs text-text-2 -mt-3">
        The grey text in each box is what the site shows today. Type to replace it, leave empty to keep it.
        {overriddenInLang > 0 && ` ${overriddenInLang} field${overriddenInLang > 1 ? 's' : ''} customised in ${lang.toUpperCase()}.`}
      </p>

      {grouped.length === 0 && <p className="font-mono text-xs text-text-2 py-8 text-center">// no field matches</p>}

      {grouped.map(([section, sectionPaths]) => (
        <section key={section} className="glass border border-border rounded-[var(--radius-lg)] p-4 sm:p-5 flex flex-col gap-4">
          <h2 className="font-display font-semibold text-text-0">{SECTION_LABELS[section] ?? section}</h2>
          {sectionPaths.map((path) => {
            const def = defaults[path] ?? '';
            const value = draft[lang][path] ?? '';
            const savedValue = data.text[lang]?.[path] ?? '';
            const isOverridden = value.trim() !== '';
            const isDirty = value.trim() !== savedValue.trim();
            const long = def.length > 90 || def.includes('\n');
            return (
              <label key={path} className="flex flex-col gap-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-xs text-text-1">
                    {prettyPath(path)}
                    {isDirty && <span className="ms-2 font-mono text-[10px] text-matrix">unsaved</span>}
                  </span>
                  {isOverridden && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); resetField(path); }}
                      className="font-mono text-[10px] text-text-2 hover:text-matrix transition-colors"
                    >
                      reset
                    </button>
                  )}
                </span>
                {long ? (
                  <textarea
                    dir={rtl ? 'rtl' : 'ltr'}
                    value={value}
                    onChange={(e) => setValue(path, e.target.value)}
                    placeholder={def}
                    maxLength={2000}
                    rows={Math.min(6, Math.max(2, Math.ceil(def.length / 80)))}
                    className={`${inputCls} resize-y ${isOverridden ? 'border-matrix/40' : ''}`}
                  />
                ) : (
                  <input
                    dir={rtl ? 'rtl' : 'ltr'}
                    value={value}
                    onChange={(e) => setValue(path, e.target.value)}
                    placeholder={def}
                    maxLength={2000}
                    className={`${inputCls} ${isOverridden ? 'border-matrix/40' : ''}`}
                  />
                )}
                <span className="font-mono text-[10px] text-text-2/60">{path}</span>
              </label>
            );
          })}
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Links tab
// ---------------------------------------------------------------------------

const LOCALIZED_LINK_KEYS: Record<string, string> = {
  youtube: 'home.quick_links.youtube',
  collab: 'home.quick_links.collab',
};

function LinksTab({ data, onSaved }: { data: ContentPayload; onSaved: (d: ContentPayload) => void }) {
  const { toast } = useToast();
  const savedList = data.links ?? data.defaults.links;
  const [list, setList] = useState<SiteLink[]>(savedList);
  // true when the list should go back to the Linktree defaults on save
  const [useDefaults, setUseDefaults] = useState(data.links === null);
  const [saving, setSaving] = useState(false);
  const [iconFor, setIconFor] = useState<number | null>(null);

  const dirty = !sameJson(list, savedList) || useDefaults !== (data.links === null);

  const update = (i: number, patch: Partial<SiteLink>) => {
    setUseDefaults(false);
    setList((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    setUseDefaults(false);
    setList((l) => {
      const next = [...l];
      const a = next[i];
      const b = next[j];
      if (!a || !b) return l;
      next[i] = b;
      next[j] = a;
      return next;
    });
  };
  const remove = (i: number) => {
    setUseDefaults(false);
    setList((l) => l.filter((_, j) => j !== i));
  };
  const add = () => {
    if (list.length >= 12) return;
    setUseDefaults(false);
    setList((l) => [...l, { key: `link-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, label: '', url: 'https://', partner: false }]);
  };
  const resetDefaults = () => {
    setList(data.defaults.links);
    setUseDefaults(true);
  };

  const save = async () => {
    const bad = list.find((l) => !l.label.trim() || !/^(https:\/\/\S+|mailto:\S+)$/i.test(l.url.trim()));
    if (!useDefaults && bad) {
      toast('Every link needs a label and a URL starting with https:// or mailto:', 'error');
      return;
    }
    setSaving(true);
    const links = useDefaults
      ? null
      : list.map((l) => ({ key: l.key, label: l.label.trim(), url: l.url.trim(), partner: !!l.partner, ...(l.icon ? { icon: l.icon } : {}) }));
    const result = await putContent({ links });
    setSaving(false);
    if ('error' in result) {
      toast(result.error, 'error');
      return;
    }
    onSaved(result);
    setList(result.links ?? data.defaults.links);
    setUseDefaults(result.links === null);
    toast(links === null ? 'Links reset to the Linktree defaults.' : 'Links saved. The site updates on the next page load.', 'success');
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <SaveBar count={dirty ? 1 : 0} saving={saving} onSave={save} label="link list change" />

      <p className="text-xs text-text-2">
        These are the rows in &quot;Quick links&quot; on the home page and on the bio page (/links), in this order.
        Ticking PARTNER shows the PARTNER label next to the link. The YouTube and Collaborations rows are
        translated: change their wording in the Texts tab (Home page · Quick links).
      </p>

      <div className="flex flex-col gap-3">
        {list.map((l, i) => (
          <div key={l.key} className="glass border border-border rounded-[var(--radius-lg)] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-text-2">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className={btnGhost}>
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === list.length - 1}
                  aria-label="Move down"
                  className={btnGhost}
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label="Remove link"
                  className={`${btnGhost} hover:!border-danger/50 hover:text-danger`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-2">
                Label
                {LOCALIZED_LINK_KEYS[l.key] && (
                  <span className="ms-2 font-mono text-[10px] text-text-2/70">
                    shown from Texts: {LOCALIZED_LINK_KEYS[l.key]}
                  </span>
                )}
              </span>
              <input value={l.label} onChange={(e) => update(i, { label: e.target.value })} maxLength={200} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-2">URL (https:// or mailto:)</span>
              <input
                value={l.url}
                onChange={(e) => update(i, { url: e.target.value })}
                maxLength={2048}
                dir="ltr"
                className={`${inputCls} font-mono text-xs`}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-text-1 w-fit cursor-pointer">
              <input
                type="checkbox"
                checked={!!l.partner}
                onChange={(e) => update(i, { partner: e.target.checked })}
                className="accent-matrix"
              />
              PARTNER (sponsored link)
            </label>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-border bg-white">
                {l.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.icon} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <ImageIcon size={14} className="text-black/40" />
                )}
              </span>
              <button type="button" onClick={() => setIconFor(i)} className={btnGhost}>
                {l.icon ? 'Change logo / icon' : 'Add logo / icon'}
              </button>
              {l.icon && (
                <button type="button" onClick={() => update(i, { icon: undefined })} className={btnGhost}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={iconFor !== null}
        onClose={() => setIconFor(null)}
        onSelect={(url, id) => {
          if (iconFor !== null) update(iconFor, { icon: mediaPath(url, id) });
          setIconFor(null);
        }}
        title="Logo or icon for this link"
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={add} disabled={list.length >= 12} className={btnGhost}>
          <Plus size={13} /> Add link {list.length >= 12 ? '(max 12)' : ''}
        </button>
        <button type="button" onClick={resetDefaults} className={btnGhost}>
          <RotateCcw size={13} /> Reset to Linktree defaults
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>('images');
  const [data, setData] = useState<ContentPayload | null>(null);
  const [error, setError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchContent().then((result) => {
      if (!alive) return;
      if ('error' in result) setError(result.error);
      else setData(result);
    });
    return () => { alive = false; };
  }, [reloadKey]);

  // The PUT answer carries the stored values only: keep slots and defaults
  const onSaved = useCallback(
    (saved: ContentPayload) =>
      setData((d) => (d ? { ...d, images: saved.images, text: saved.text, links: saved.links } : d)),
    []
  );

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// content</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Site content</h1>
        <p className="text-sm text-text-2 mt-1">
          Replace the images, rewrite the texts and order the links of the public website. Nothing changes on
          the site until you press Save.
        </p>
      </div>

      <div className="flex gap-1 flex-wrap">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-full font-mono transition-colors ${
              tab === value ? 'bg-matrix text-bg-0 font-bold' : 'text-text-2 hover:text-text-1 border border-border'
            }`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="glass border border-danger/40 rounded-[var(--radius-lg)] p-5 flex flex-col gap-3">
          <p className="text-sm text-danger">{error}</p>
          <button type="button" onClick={() => { setError(''); setReloadKey((k) => k + 1); }} className={`${btnGhost} w-fit`}>
            <RotateCcw size={13} /> Try again
          </button>
        </div>
      ) : !data ? (
        <div className="flex items-center gap-2 py-8 text-text-2">
          <Loader2 size={16} className="animate-spin text-matrix" />
          <span className="font-mono text-xs">Loading content...</span>
        </div>
      ) : (
        // All tabs stay mounted so switching tabs keeps unsaved edits
        <>
          <div hidden={tab !== 'images'}><ImagesTab data={data} onSaved={onSaved} /></div>
          <div hidden={tab !== 'texts'}><TextsTab data={data} onSaved={onSaved} /></div>
          <div hidden={tab !== 'links'}><LinksTab data={data} onSaved={onSaved} /></div>
        </>
      )}
    </div>
  );
}
