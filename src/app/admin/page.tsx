'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Link2, BarChart2, ArrowRight } from 'lucide-react';

interface PostRow {
  _id: string;
  title: string;
  status: string;
  language: string;
  createdAt: string;
}

interface PostsResponse {
  posts: PostRow[];
  pagination: { total: number };
}

export default function AdminDashboard() {
  const [data, setData] = useState<PostsResponse | null>(null);

  useEffect(() => {
    fetch('/api/posts?admin=true&limit=5')
      .then((r) => r.json())
      .then(setData)
      .catch(() => null);
  }, []);

  const total = data?.pagination.total ?? '—';
  const recent = data?.posts ?? [];

  const stats = [
    { label: 'Total posts', value: total, icon: FileText, href: '/admin/posts' },
    { label: 'Links', value: '—', icon: Link2, href: '/admin/links' },
    { label: 'Social accounts', value: '—', icon: BarChart2, href: '/admin/social' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// dashboard</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Overview</h1>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="glass border border-border rounded-[var(--radius-lg)] p-5 flex items-start justify-between gap-4 hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
          >
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-display font-bold text-text-0">{String(value)}</span>
              <span className="text-xs text-text-2 font-mono">{label}</span>
            </div>
            <Icon size={18} className="text-matrix/60 mt-1 shrink-0" />
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-text-0">Recent posts</h2>
          <Link
            href="/admin/posts"
            className="flex items-center gap-1.5 text-xs font-mono text-matrix hover:gap-2.5 transition-all duration-[var(--duration-fast)]"
          >
            All posts <ArrowRight size={12} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="font-mono text-xs text-text-2 py-4">No posts yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-lg)] overflow-hidden">
            {recent.map((post) => (
              <Link
                key={post._id}
                href={`/admin/posts/${post._id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-1 transition-colors duration-[var(--duration-fast)]"
              >
                <span className="flex-1 text-sm text-text-1 truncate">{post.title}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-2 shrink-0">
                  {post.language}
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-widest shrink-0 ${
                    post.status === 'published' ? 'text-matrix' : 'text-text-2'
                  }`}
                >
                  {post.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
        >
          + New post
        </Link>
        <Link
          href="/admin/links"
          className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
        >
          Manage links
        </Link>
      </div>
    </div>
  );
}
