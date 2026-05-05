'use client';

import { useEffect, useState } from 'react';
import { Trash2, Eye, EyeOff, Plus, GripVertical } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface LinkItem {
  _id: string;
  title: string;
  url: string;
  icon: string;
  description?: string;
  isVisible: boolean;
  order: number;
  clicks: number;
}

interface LinkForm {
  title: string;
  url: string;
  icon: string;
  description: string;
}

const inputCls = 'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors duration-[var(--duration-fast)]';
const labelCls = 'block text-xs font-medium text-text-2 mb-1';

export default function AdminLinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset } = useForm<LinkForm>({ defaultValues: { icon: 'link' } });

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/links?admin=true');
    if (res.ok) setLinks(await res.json() as LinkItem[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleAdd = async (data: LinkForm) => {
    setSaving(true);
    setError('');
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const link = await res.json() as LinkItem;
      setLinks((prev) => [...prev, link]);
      reset({ icon: 'link' });
      setAdding(false);
    } else {
      const err = await res.json() as { error?: string };
      setError(err.error ?? 'Failed to add link.');
    }
    setSaving(false);
  };

  const toggleVisibility = async (link: LinkItem) => {
    const res = await fetch(`/api/links/${link._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible: !link.isVisible }),
    });
    if (res.ok) setLinks((prev) => prev.map((l) => l._id === link._id ? { ...l, isVisible: !l.isVisible } : l));
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
    if (res.ok) setLinks((prev) => prev.filter((l) => l._id !== id));
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-matrix tracking-[0.15em]">// link-in-bio</span>
          <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Links</h1>
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
        >
          <Plus size={14} /> Add link
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form
          onSubmit={handleSubmit(handleAdd)}
          className="glass border border-border rounded-[var(--radius-lg)] p-5 flex flex-col gap-4"
        >
          <h2 className="text-sm font-medium text-text-0">New link</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Title *</label>
              <input {...register('title', { required: true })} placeholder="GitHub" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>URL *</label>
              <input {...register('url', { required: true })} placeholder="https://github.com/..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Icon (lucide name)</label>
              <input {...register('icon')} placeholder="github" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input {...register('description')} placeholder="Optional short description" className={inputCls} />
            </div>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setError(''); reset({ icon: 'link' }); }}
              className="px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="font-mono text-xs text-text-2 py-8">Loading...</p>
      ) : links.length === 0 ? (
        <p className="font-mono text-xs text-text-2 py-8">No links yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {links.map((link) => (
            <div
              key={link._id}
              className={`flex items-center gap-3 glass border rounded-[var(--radius-md)] px-4 py-3 transition-colors duration-[var(--duration-fast)] ${
                link.isVisible ? 'border-border' : 'border-border opacity-50'
              }`}
            >
              <GripVertical size={14} className="text-text-2 shrink-0 cursor-grab" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-0 truncate">{link.title}</p>
                <p className="text-xs text-text-2 truncate">{link.url}</p>
              </div>
              <span className="text-xs font-mono text-text-2 shrink-0">{link.clicks} clicks</span>
              <button
                onClick={() => toggleVisibility(link)}
                className="text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)] shrink-0"
                title={link.isVisible ? 'Hide' : 'Show'}
              >
                {link.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={() => handleDelete(link._id, link.title)}
                className="text-text-2 hover:text-danger transition-colors duration-[var(--duration-fast)] shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
