'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Rss,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BRAND } from '@/lib/brand';
import { useToast } from '@/components/ui/Toast';
import InlineDeleteConfirm from '@/components/admin/InlineDeleteConfirm';
import type { LatestSourceType } from '@/models/LatestSource';

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const inputCls =
  'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors';
const labelCls = 'block text-xs font-medium text-text-2 mb-1';
const btnPrimary =
  'px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors';
const btnGhost =
  'px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LatestSourceItem {
  _id: string;
  type: LatestSourceType;
  label: string;
  rssUrl?: string;
  manualUrl?: string;
  manualTitle?: string;
  manualThumb?: string;
  active: boolean;
  order: number;
}

interface SiteProfileData {
  name: string;
  tagline: string;
  statusLine?: string;
  statusEnabled: boolean;
  subscriberCount: number;
}

// ---------------------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------------------

// The Sponsored / Resources / Services card tabs were removed: /links never
// rendered those cards. Bio page links are edited in Content > Links.
type Tab = 'profile' | 'latest';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'latest', label: 'Latest' },
];

// ---------------------------------------------------------------------------
// Latest sources manager
// ---------------------------------------------------------------------------

const SOURCE_TYPES: LatestSourceType[] = ['youtube', 'blog', 'tiktok', 'instagram'];

function LatestSourceForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<LatestSourceItem>;
  onSave: (data: Partial<LatestSourceItem>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<LatestSourceItem>>({
    type: 'youtube',
    label: '',
    rssUrl: '',
    manualUrl: '',
    manualTitle: '',
    manualThumb: '',
    active: true,
    ...initial,
  });

  const set = (key: keyof LatestSourceItem, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const useManual = !form.rssUrl;

  return (
    <div className="glass border border-border rounded-[var(--radius-lg)] p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-text-0">
        {initial?._id ? 'Edit source' : 'New source'}
      </h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            className={inputCls}
          >
            {SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Label (shown on card)</label>
          <input
            value={form.label ?? ''}
            onChange={(e) => set('label', e.target.value)}
            placeholder="e.g. YouTube"
            className={inputCls}
            maxLength={50}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>
          RSS / Atom URL{' '}
          <span className="text-text-2 font-normal">(leave blank to use manual override)</span>
        </label>
        <input
          value={form.rssUrl ?? ''}
          onChange={(e) => set('rssUrl', e.target.value)}
          placeholder="https://www.youtube.com/feeds/videos.xml?channel_id=..."
          className={inputCls}
        />
      </div>

      {useManual && (
        <div className="flex flex-col gap-3 p-4 rounded-[var(--radius-md)] bg-bg-1 border border-border">
          <p className="text-xs text-text-2 font-mono">Manual override (no RSS)</p>
          <div>
            <label className={labelCls}>URL</label>
            <input
              value={form.manualUrl ?? ''}
              onChange={(e) => set('manualUrl', e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Title</label>
            <input
              value={form.manualTitle ?? ''}
              onChange={(e) => set('manualTitle', e.target.value)}
              placeholder="Content title"
              className={inputCls}
              maxLength={200}
            />
          </div>
          <div>
            <label className={labelCls}>Thumbnail URL (optional)</label>
            <input
              value={form.manualThumb ?? ''}
              onChange={(e) => set('manualThumb', e.target.value)}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-text-1 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={form.active ?? true}
          onChange={(e) => set('active', e.target.checked)}
          className="accent-matrix"
        />
        Active
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving || !form.label || !form.type}
          onClick={() => onSave(form)}
          className={btnPrimary}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function SortableSourceRow({
  source,
  onToggle,
  onDelete,
  onEdit,
}: {
  source: LatestSourceItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: source._id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 glass border rounded-[var(--radius-md)] px-4 py-3 transition-colors ${
        source.active ? 'border-border' : 'border-border opacity-50'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-text-2 hover:text-text-1 transition-colors shrink-0 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>

      <div className="w-16 shrink-0">
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg-1 border border-border text-text-2 uppercase">
          {source.type}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-0">{source.label}</p>
        <p className="text-xs text-text-2 truncate">
          {source.rssUrl ? (
            <span className="flex items-center gap-1">
              <Rss size={9} className="shrink-0" />
              {source.rssUrl}
            </span>
          ) : source.manualUrl ? (
            source.manualTitle
          ) : (
            'No source configured'
          )}
        </p>
      </div>

      <button
        onClick={onEdit}
        className="text-text-2 hover:text-text-1 transition-colors shrink-0 text-xs font-mono px-2 py-1 glass rounded border border-border hover:border-matrix/30"
      >
        Edit
      </button>
      <button
        onClick={onToggle}
        className="text-text-2 hover:text-text-1 transition-colors shrink-0"
        title={source.active ? 'Deactivate' : 'Activate'}
      >
        {source.active ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <InlineDeleteConfirm label={`Delete "${source.label}"`} onConfirm={onDelete} />
    </div>
  );
}

function LatestManager() {
  const { toast } = useToast();
  const [sources, setSources] = useState<LatestSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/links-page/sources?admin=true');
    if (res.ok) setSources(((await res.json()) as LatestSourceItem[]).sort((a, b) => a.order - b.order));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async (data: Partial<LatestSourceItem>) => {
    setSaving(true);
    const res = await fetch('/api/links-page/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast('Source added', 'success');
      setAdding(false);
      await load();
    } else {
      const err = (await res.json()) as { error?: string };
      toast(err.error ?? 'Failed to add source', 'error');
    }
    setSaving(false);
  };

  const handleEdit = async (id: string, data: Partial<LatestSourceItem>) => {
    setSaving(true);
    const res = await fetch(`/api/links-page/sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast('Source updated', 'success');
      setEditingId(null);
      await load();
    } else {
      toast('Failed to update source', 'error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/links-page/sources/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSources((prev) => prev.filter((s) => s._id !== id));
      toast('Source deleted', 'success');
    } else {
      toast('Failed to delete source', 'error');
    }
  };

  const handleToggle = async (source: LatestSourceItem) => {
    const res = await fetch(`/api/links-page/sources/${source._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !source.active }),
    });
    if (res.ok) setSources((prev) => prev.map((s) => s._id === source._id ? { ...s, active: !s.active } : s));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = sources.findIndex((s) => s._id === active.id);
    const newIdx = sources.findIndex((s) => s._id === over.id);
    const reordered = arrayMove(sources, oldIdx, newIdx);
    setSources(reordered);
    // Reuse the cards reorder endpoint pattern via sources
    await Promise.all(
      reordered.map((s, idx) =>
        fetch(`/api/links-page/sources/${s._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: idx }),
        })
      )
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await fetch('/api/links-page/refresh', { method: 'POST' });
    toast(res.ok ? 'RSS feeds refreshed' : 'Refresh failed', res.ok ? 'success' : 'error');
    setRefreshing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display font-bold text-lg text-text-0">Latest content sources</h2>
        <div className="flex gap-2">
          <button
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className={`${btnGhost} flex items-center gap-1.5`}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh feeds
          </button>
          {!adding && (
            <button onClick={() => setAdding(true)} className={btnPrimary}>
              <Plus size={14} className="inline mr-1.5" />
              Add source
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-text-2">
        Each active source shows its latest item on the public page. RSS feeds are cached for 1 hour —
        use &quot;Refresh feeds&quot; to bust the cache immediately.
      </p>

      {adding && (
        <LatestSourceForm
          onSave={(d) => void handleAdd(d)}
          onCancel={() => setAdding(false)}
          saving={saving}
        />
      )}

      {loading ? (
        <p className="font-mono text-xs text-text-2 py-6">Loading...</p>
      ) : sources.length === 0 ? (
        <p className="font-mono text-xs text-text-2 py-6">No sources yet.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
          <SortableContext items={sources.map((s) => s._id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {sources.map((source) =>
                editingId === source._id ? (
                  <LatestSourceForm
                    key={source._id}
                    initial={source}
                    onSave={(d) => void handleEdit(source._id, d)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                ) : (
                  <SortableSourceRow
                    key={source._id}
                    source={source}
                    onToggle={() => void handleToggle(source)}
                    onDelete={() => void handleDelete(source._id)}
                    onEdit={() => setEditingId(source._id)}
                  />
                )
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile tab
// ---------------------------------------------------------------------------

const DEFAULT_PROFILE: SiteProfileData = {
  name: 'Riyad Ketami',
  tagline: 'Digital Entrepreneur · AI Consultant · Creator',
  statusLine: '',
  statusEnabled: false,
  subscriberCount: 5000,
};

function ProfileTab() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<SiteProfileData>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch('/api/links-page/profile')
      .then((r) => r.json())
      .then((d: SiteProfileData) => setProfile(d))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/links-page/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    toast(res.ok ? 'Profile saved' : 'Failed to save', res.ok ? 'success' : 'error');
    setSaving(false);
  };

  if (loading) return <p className="font-mono text-xs text-text-2 py-8">Loading...</p>;

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <h2 className="font-display font-bold text-lg text-text-0">Profile</h2>

      {/* Identity is not editable here: it comes from BRAND (src/lib/brand.ts),
          the single source of truth from the brand brief. */}
      <div className="flex flex-col gap-1 p-4 rounded-[var(--radius-md)] bg-bg-1 border border-border">
        <p className="text-xs font-semibold text-text-1 font-mono">Identity (read-only)</p>
        <p className="text-sm text-text-0">{BRAND.name}</p>
        <p className="text-xs text-text-2">
          {BRAND.title} · {BRAND.proofLine}
        </p>
        <p className="text-xs text-text-2 mt-1">
          Name, title, quick links and socials come from <code className="font-mono">src/lib/brand.ts</code>.
        </p>
      </div>

      {/* Status line */}
      <div className="flex flex-col gap-3 p-4 rounded-[var(--radius-md)] bg-bg-1 border border-border">
        <label className="flex items-center gap-2 text-sm text-text-1 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={profile.statusEnabled}
            onChange={(e) => setProfile((p) => ({ ...p, statusEnabled: e.target.checked }))}
            className="accent-matrix"
          />
          Show status line
        </label>
        {profile.statusEnabled && (
          <div>
            <label className={labelCls}>Status text</label>
            <input
              value={profile.statusLine ?? ''}
              onChange={(e) => setProfile((p) => ({ ...p, statusLine: e.target.value }))}
              placeholder="Building Algeria Business Bay"
              className={inputCls}
              maxLength={200}
            />
          </div>
        )}
      </div>

      {/* Brief §2.1: no follower or subscriber counts anywhere on the public site */}
      <div className="p-4 rounded-[var(--radius-md)] bg-bg-1 border border-border flex flex-col gap-2">
        <p className="text-xs font-semibold text-text-1 font-mono">Follower counts</p>
        <p className="text-xs text-text-2">
          Never shown publicly. Content Stats keeps them for your own tracking only.
        </p>
      </div>

      <button onClick={() => void handleSave()} disabled={saving} className={`${btnPrimary} flex items-center gap-2 w-fit`}>
        <Save size={14} />
        {saving ? 'Saving...' : 'Save profile'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminLinksPage() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// links page</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Links admin</h1>
        <p className="text-sm text-text-2 mt-1">
          Manage your public{' '}
          <a href="/links" target="_blank" rel="noopener noreferrer" className="text-matrix hover:underline">
            /links
          </a>{' '}
          page content.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-0.5 bg-bg-0 border border-border rounded-[var(--radius-md)] w-fit overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-sm rounded transition-colors whitespace-nowrap font-mono ${
              tab === t.id
                ? 'bg-matrix text-bg-0 font-bold'
                : 'text-text-2 hover:text-text-1'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-2 border border-border rounded-[var(--radius-md)] px-4 py-3">
        Bio page links (the list on /links) are managed in{' '}
        <Link href="/rk-studio/content" className="text-matrix hover:underline">Content &gt; Links</Link>.
        This page edits the profile header and the Latest content sources.
      </p>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'latest' && <LatestManager />}
      </div>
    </div>
  );
}
