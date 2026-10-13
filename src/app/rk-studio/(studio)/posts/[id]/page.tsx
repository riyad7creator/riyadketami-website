'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BLOG_CATEGORIES } from '@/lib/blog-categories';
import ImageUploader from '@/components/admin/ImageUploader';
import AIWriterPanel from '@/components/admin/AIWriterPanel';
import TranslationsSection from '@/components/admin/TranslationsSection';
import ToastBanner, { type Toast } from '@/components/admin/ToastBanner';

const TiptapEditor = dynamic(() => import('@/components/admin/TiptapEditor'), { ssr: false });

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

interface LoadedPost {
  title?: string;
  slug?: string;
  language?: string;
  status?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  tags?: string[];
  readTime?: number;
  updatedAt?: string;
}

const EMPTY: PostForm = {
  title: '', slug: '', language: 'en', status: 'draft',
  category: '', excerpt: '', content: '', featuredImage: '', tags: '', readTime: '5',
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function calcReadTime(html: string, lang: string = 'en'): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/gu, ' ').trim();
  const words = text ? text.split(/\s+/u).length : 0;
  // Locale-aware reading speed (words per minute)
  const wpm = lang === 'ar' ? 180 : lang === 'fr' ? 210 : 238;
  return Math.max(1, Math.round(words / wpm));
}

const inputCls = 'w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 transition-colors duration-[var(--duration-fast)]';
const labelCls = 'block text-xs font-medium text-text-2 mb-1.5';
const selectCls = `${inputCls} cursor-pointer`;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function PostEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();

  const [form, setForm] = useState<PostForm>(EMPTY);
  const [loadedPost, setLoadedPost] = useState<{ updatedAt?: string; _id?: string } | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [translationsKey, setTranslationsKey] = useState(0);

  const savedFormRef = useRef<PostForm>(EMPTY);
  const currentIdRef = useRef<string>(id);

  useEffect(() => { currentIdRef.current = id; }, [id]);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/posts/${id}`)
      .then((r) => r.json())
      .then((post: LoadedPost) => {
        const loaded: PostForm = {
          title: post.title ?? '',
          slug: (post as Record<string, unknown>).slug as string ?? '',
          language: post.language ?? 'en',
          status: post.status ?? 'draft',
          category: post.category ?? '',
          excerpt: post.excerpt ?? '',
          content: post.content ?? '',
          featuredImage: post.featuredImage ?? '',
          tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
          readTime: String(post.readTime ?? 5),
        };
        setForm(loaded);
        savedFormRef.current = loaded;
        setLoadedPost({ updatedAt: post.updatedAt, _id: id });
        setLoading(false);
      })
      .catch(() => { setError('Failed to load post.'); setLoading(false); });
  }, [id, isNew]);

  // Auto-save every 30 seconds when dirty
  const autoSave = useCallback(async () => {
    if (isNew || saving) return;
    setSaveState('saving');
    const body = buildBody(savedFormRef.current === form ? form : form);
    try {
      const res = await fetch(`/api/posts/${currentIdRef.current}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        savedFormRef.current = { ...form };
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2500);
      } else {
        setSaveState('error');
        setTimeout(() => setSaveState('idle'), 3000);
      }
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isNew]);

  useEffect(() => {
    if (isNew) return;
    const timer = setInterval(() => {
      const isDirty = JSON.stringify(form) !== JSON.stringify(savedFormRef.current);
      if (isDirty && !saving) void autoSave();
    }, 30_000);
    return () => clearInterval(timer);
  }, [form, saving, isNew, autoSave]);

  function buildBody(f: PostForm, statusOverride?: string) {
    return {
      title: f.title,
      slug: f.slug,
      language: f.language,
      status: statusOverride ?? f.status,
      category: f.category || undefined,
      excerpt: f.excerpt || undefined,
      content: f.content,
      featuredImage: f.featuredImage || undefined,
      tags: f.tags ? f.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      readTime: parseInt(f.readTime) || calcReadTime(f.content, f.language),
    };
  }

  /** Shared save logic — returns the saved post ID or null on failure */
  const savePost = async (statusOverride?: string): Promise<string | null> => {
    const body = buildBody(form, statusOverride);
    const res = await fetch(isNew ? '/api/posts' : `/api/posts/${id}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      setError(err.error ?? 'Save failed.');
      return null;
    }
    const saved = await res.json() as { _id: string };
    savedFormRef.current = { ...form };
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2500);
    return saved._id;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError('');
    await savePost();
    setSaving(false);
  };

  const handlePublish = async () => {
    const isPublishing = form.status !== 'published';
    setSaving(true);
    setError('');
    setToast(null);

    if (isPublishing && form.language === 'en') {
      setToast({ state: 'publishing', message: 'Publishing... Translating to FR and AR automatically' });
    }

    const savedId = await savePost(isPublishing ? 'published' : 'draft');
    if (!savedId) {
      setSaving(false);
      setToast(null);
      return;
    }

    // Update local status immediately
    if (!isNew) {
      setForm((prev) => ({ ...prev, status: isPublishing ? 'published' : 'draft' }));
    }

    // Auto-translate for English posts being published
    if (isPublishing && form.language === 'en') {
      setToast({ state: 'translating', message: 'Publishing... Translating to FR and AR automatically' });
      try {
        const res = await fetch('/api/admin/translate-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: savedId, langs: ['fr', 'ar'] }),
        });
        const data = await res.json() as Record<string, { status: string; error?: string }>;
        const frOk = data.fr?.status === 'ok';
        const arOk = data.ar?.status === 'ok';

        if (frOk && arOk) {
          setToast({ state: 'done', message: '✓ Published in EN, FR, AR' });
        } else if (!frOk && !arOk) {
          setToast({ state: 'partial', message: 'Published in EN. Translations failed — retry in the Translations section below' });
        } else {
          const failed = !frOk ? 'FR' : 'AR';
          setToast({ state: 'partial', message: `Published in EN. ${failed} translation failed — retry in admin` });
        }

        setTranslationsKey((k) => k + 1);
        setTimeout(() => setToast(null), 7000);
      } catch {
        setToast({ state: 'partial', message: 'Published in EN. Translation error — retry in the Translations section below' });
        setTimeout(() => setToast(null), 7000);
      }
    } else if (!isPublishing) {
      setToast(null);
    }

    // For new posts: navigate after translations are done
    if (isNew) {
      router.replace(`/admin/posts/${savedId}`);
    }

    setSaving(false);
  };

  const set = (field: keyof PostForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: val };
        if (field === 'title' && (isNew || !prev.slug || prev.slug === slugify(prev.title))) {
          next.slug = slugify(val);
        }
        return next;
      });
    };

  const setContent = useCallback((html: string) => {
    setForm((prev) => ({ ...prev, content: html, readTime: String(calcReadTime(html, prev.language)) }));
  }, []);

  const handleAIInsert = useCallback((html: string) => { setContent(html); }, [setContent]);

  if (loading) return <p className="font-mono text-xs text-text-2 py-8">Loading...</p>;

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedFormRef.current);
  const showTranslations = !isNew && form.language === 'en' && id !== 'new';

  // Build the enPost object for the TranslationsSection
  const enPost = {
    _id: id,
    title: form.title,
    excerpt: form.excerpt,
    content: form.content,
    slug: form.slug,
    updatedAt: loadedPost?.updatedAt ?? new Date().toISOString(),
  };

  return (
    <>
      <AIWriterPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onInsert={handleAIInsert}
        postTitle={form.title}
        language={form.language}
      />

      <div className="flex flex-col gap-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/rk-studio/posts" className="text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)]">
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

          <div className="flex items-center gap-3">
            {/* Auto-save indicator */}
            {!isNew && (
              <span className={`font-mono text-[10px] tracking-widest flex items-center gap-1.5 transition-opacity duration-300 ${saveState === 'idle' && !isDirty ? 'opacity-0' : 'opacity-100'}`}>
                {saveState === 'saving' && <><Clock size={10} className="animate-spin" /><span className="text-text-2">Saving...</span></>}
                {saveState === 'saved' && <><CheckCircle2 size={10} className="text-matrix" /><span className="text-matrix">Saved</span></>}
                {saveState === 'error' && <span className="text-danger">Save failed</span>}
                {saveState === 'idle' && isDirty && <span className="text-text-2">Unsaved</span>}
              </span>
            )}

            <button
              onClick={() => void handleSaveDraft()}
              disabled={saving}
              className="px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
            >
              {saving ? 'Saving...' : 'Save draft'}
            </button>
            <button
              onClick={() => void handlePublish()}
              disabled={saving}
              className="px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
            >
              {saving
                ? (toast?.state === 'translating' ? 'Translating...' : 'Publishing...')
                : form.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Toast */}
        <ToastBanner toast={toast} onDismiss={() => setToast(null)} />

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
            <div className="relative">
              <input type="number" min={1} value={form.readTime} onChange={set('readTime')} className={inputCls} />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-text-2 pointer-events-none">auto</span>
            </div>
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

        {/* Content editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-text-2">Content</label>
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="flex items-center gap-1.5 text-xs text-matrix/70 hover:text-matrix transition-colors duration-[var(--duration-fast)] font-mono"
            >
              <Sparkles size={11} /> AI Writer
            </button>
          </div>
          <TiptapEditor
            content={form.content}
            onChange={setContent}
            placeholder="Write your post here..."
            dir={form.language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        {/* Featured image + Tags */}
        <div className="grid sm:grid-cols-2 gap-6">
          <ImageUploader
            value={form.featuredImage}
            onChange={(url) => setForm((prev) => ({ ...prev, featuredImage: url }))}
            label="Featured image"
          />
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input value={form.tags} onChange={set('tags')} placeholder="ai, product, strategy" className={inputCls} />
          </div>
        </div>

        {/* Translations section — only for EN posts */}
        {showTranslations && (
          <TranslationsSection
            postId={id}
            enPost={enPost}
            refreshKey={translationsKey}
          />
        )}
      </div>
    </>
  );
}
