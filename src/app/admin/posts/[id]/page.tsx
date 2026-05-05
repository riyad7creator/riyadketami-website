'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { BLOG_CATEGORIES } from '@/lib/blog-categories';

interface PostForm {
  title: string;
  slug: string;
  language: string;
  status: string;
  category: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  tags: string;
  readTime: string;
}

const EMPTY: PostForm = {
  title: '', slug: '', language: 'en', status: 'draft',
  category: '', excerpt: '', content: '', featuredImage: '', tags: '', readTime: '5',
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const inputCls = 'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors duration-[var(--duration-fast)]';
const labelCls = 'block text-xs font-medium text-text-2 mb-1.5';
const selectCls = `${inputCls} cursor-pointer`;

export default function PostEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();

  const [form, setForm] = useState<PostForm>(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then((post: Partial<PostForm> & { tags?: string[] }) => {
        setForm({
          title: post.title ?? '',
          slug: (post as Record<string, unknown>).slug as string ?? '',
          language: post.language ?? 'en',
          status: post.status ?? 'draft',
          category: post.category ?? '',
          excerpt: post.excerpt ?? '',
          content: post.content ?? '',
          featuredImage: post.featuredImage ?? '',
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
          readTime: String((post as Record<string, unknown>).readTime ?? 5),
        });
        setLoading(false);
      })
      .catch(() => { setError('Failed to load post.'); setLoading(false); });
  }, [id, isNew]);

  const set = (field: keyof PostForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'title' && (isNew || !prev.slug || prev.slug === slugify(prev.title))) {
        next.slug = slugify(val);
      }
      return next;
    });
  };

  const handleSave = async (publishOverride?: boolean) => {
    setSaving(true);
    setError('');
    const body = {
      title: form.title,
      slug: form.slug,
      language: form.language,
      status: publishOverride !== undefined ? (publishOverride ? 'published' : 'draft') : form.status,
      category: form.category || undefined,
      excerpt: form.excerpt || undefined,
      content: form.content,
      featuredImage: form.featuredImage || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      readTime: parseInt(form.readTime) || 5,
    };

    const res = await fetch(isNew ? '/api/posts' : `/api/posts/${id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const saved = await res.json() as { _id: string };
      if (isNew) router.replace(`/admin/posts/${saved._id}`);
      else setForm((prev) => ({ ...prev, status: body.status }));
    } else {
      const err = await res.json() as { error?: string };
      setError(err.error ?? 'Save failed.');
    }
    setSaving(false);
  };

  if (loading) return <p className="font-mono text-xs text-text-2 py-8">Loading...</p>;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts" className="text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)]">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <span className="font-mono text-xs text-matrix tracking-[0.15em]">
              {isNew ? '// new post' : '// editing'}
            </span>
            <h1 className="font-display font-bold text-xl text-text-0 mt-0.5">
              {isNew ? 'New post' : (form.title || 'Untitled')}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
          >
            {saving ? 'Saving...' : 'Save draft'}
          </button>
          <button
            onClick={() => handleSave(form.status !== 'published')}
            disabled={saving}
            className="px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
          >
            {form.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Meta row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className={labelCls}>Language</label>
          <select value={form.language} onChange={set('language')} className={selectCls}>
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="ar">AR</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select value={form.status} onChange={set('status')} className={selectCls}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Category</label>
          <select value={form.category} onChange={set('category')} className={selectCls}>
            <option value="">— None —</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Read time (min)</label>
          <input type="number" min={1} value={form.readTime} onChange={set('readTime')} className={inputCls} />
        </div>
      </div>

      {/* Title + Slug */}
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Title *</label>
          <input value={form.title} onChange={set('title')} placeholder="Post title" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Slug</label>
          <input value={form.slug} onChange={set('slug')} placeholder="post-slug" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Excerpt</label>
          <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} placeholder="Short description..." className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Content */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelCls.replace('mb-1.5', '')}>Content (HTML)</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => alert('// AI Writer — coming in a future release')}
              className="flex items-center gap-1.5 text-xs text-matrix/70 hover:text-matrix transition-colors duration-[var(--duration-fast)] font-mono"
            >
              <Sparkles size={11} /> AI Writer
            </button>
            <button
              onClick={() => setPreview((p) => !p)}
              className="text-xs text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)] font-mono"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>
        {preview ? (
          <div
            className="min-h-[320px] bg-bg-1 border border-border rounded-[var(--radius-md)] p-4 prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-text-0 prose-p:text-text-1 prose-a:text-matrix prose-code:text-matrix"
            dangerouslySetInnerHTML={{ __html: form.content }}
          />
        ) : (
          <textarea
            value={form.content}
            onChange={set('content')}
            rows={18}
            placeholder="<p>Write your post content here...</p>"
            className={`${inputCls} resize-y font-mono text-xs leading-relaxed`}
          />
        )}
      </div>

      {/* Footer fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Featured image URL</label>
          <input value={form.featuredImage} onChange={set('featuredImage')} placeholder="https://..." className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tags (comma-separated)</label>
          <input value={form.tags} onChange={set('tags')} placeholder="ai, product, strategy" className={inputCls} />
        </div>
      </div>
    </div>
  );
}
