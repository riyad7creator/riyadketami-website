'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Pencil, Plus } from 'lucide-react';
import InlineDeleteConfirm from '@/components/admin/InlineDeleteConfirm';

interface Post {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  language: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

interface Translation {
  _id: string;
  translated_from: string;
  language: string;
}

const LANG_OPTIONS = ['', 'en', 'fr', 'ar'];
const STATUS_OPTIONS = ['', 'published', 'draft'];

/** Small FR/AR pill that links directly to translate panel */
function TransBadge({
  lang,
  exists,
  postId,
}: {
  lang: string;
  exists: boolean;
  postId: string;
}) {
  return (
    <Link
      href={`/admin/posts/${postId}#translations`}
      title={exists ? `${lang.toUpperCase()} translated` : `${lang.toUpperCase()} missing — click to translate`}
      className={`inline-flex items-center px-1.5 py-0.5 rounded font-mono text-[10px] tracking-widest border transition-colors duration-[var(--duration-fast)]
        ${exists
          ? 'text-matrix border-matrix/30 bg-matrix/[0.08] hover:bg-matrix/[0.15]'
          : 'text-text-2 border-border/60 bg-transparent hover:border-danger/40 hover:text-danger/80'
        }`}
    >
      {lang.toUpperCase()} {exists ? '✓' : '✗'}
    </Link>
  );
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  // Map from postId → set of translated languages
  const [transMap, setTransMap] = useState<Record<string, Set<string>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ admin: 'true', limit: '20', page: String(page) });
    if (search) params.set('search', search);
    if (lang) params.set('language', lang);
    if (status) params.set('status', status);
    const res = await fetch(`/api/posts?${params}`);
    if (res.ok) {
      const data = await res.json() as { posts: Post[]; pagination: { total: number } };
      setPosts(data.posts);
      setTotal(data.pagination.total);

      // Batch-fetch translations for all EN posts in one request
      const enIds = data.posts.filter((p) => p.language === 'en').map((p) => p._id);
      if (enIds.length > 0) {
        try {
          const r = await fetch(`/api/admin/translate-post?postIds=${enIds.join(',')}`);
          if (r.ok) {
            const batchMap = await r.json() as Record<string, string[]>;
            const map: Record<string, Set<string>> = {};
            for (const [id, langs] of Object.entries(batchMap)) {
              map[id] = new Set(langs);
            }
            setTransMap(map);
          }
        } catch {
          setTransMap({});
        }
      } else {
        setTransMap({});
      }
    }
    setLoading(false);
  }, [search, lang, status, page]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) setPosts((prev) => prev.filter((p) => p._id !== id));
  };

  const selectCls = 'bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-text-1 focus:outline-none focus:border-matrix/50';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-matrix tracking-[0.15em]">// content</span>
          <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Posts</h1>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
        >
          <Plus size={14} /> New post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-1.5 text-sm text-text-1 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 w-52"
        />
        <select value={lang} onChange={(e) => { setLang(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All languages</option>
          {LANG_OPTIONS.filter(Boolean).map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="self-center text-xs text-text-2 font-mono">{total} total</span>
      </div>

      {/* Table */}
      {loading ? (
        <p className="font-mono text-xs text-text-2 py-8">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="font-mono text-xs text-text-2 py-8">No posts found.</p>
      ) : (
        <div className="border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-1/60">
                <th className="text-start px-4 py-3 text-xs font-mono text-text-2 uppercase tracking-widest">Title</th>
                <th className="text-start px-4 py-3 text-xs font-mono text-text-2 uppercase tracking-widest w-16">Lang</th>
                <th className="text-start px-4 py-3 text-xs font-mono text-text-2 uppercase tracking-widest w-24">Translations</th>
                <th className="text-start px-4 py-3 text-xs font-mono text-text-2 uppercase tracking-widest w-28">Category</th>
                <th className="text-start px-4 py-3 text-xs font-mono text-text-2 uppercase tracking-widest w-24">Status</th>
                <th className="text-start px-4 py-3 text-xs font-mono text-text-2 uppercase tracking-widest w-28">Date</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => {
                const langs = transMap[post._id];
                const isEn = post.language === 'en';
                return (
                  <tr key={post._id} className="hover:bg-bg-1/40 transition-colors duration-[var(--duration-fast)]">
                    <td className="px-4 py-3 text-text-1 truncate max-w-xs">{post.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-2 uppercase">{post.language}</td>
                    <td className="px-4 py-3">
                      {isEn ? (
                        <div className="flex items-center gap-1">
                          <TransBadge lang="fr" exists={langs?.has('fr') ?? false} postId={post._id} />
                          <TransBadge lang="ar" exists={langs?.has('ar') ?? false} postId={post._id} />
                        </div>
                      ) : (
                        <span className="font-mono text-[10px] text-text-2">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-2">{post.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${post.status === 'published' ? 'text-matrix' : 'text-text-2'}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-2">
                      {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/posts/${post._id}`} className="text-text-2 hover:text-matrix transition-colors duration-[var(--duration-fast)]">
                          <Pencil size={14} />
                        </Link>
                        <InlineDeleteConfirm
                          label={`Delete "${post.title}"`}
                          onConfirm={() => void handleDelete(post._id)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs glass border border-border rounded-[var(--radius-md)] text-text-1 disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs glass border border-border rounded-[var(--radius-md)] text-text-1 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
