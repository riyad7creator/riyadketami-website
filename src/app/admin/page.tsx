'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Link2, BarChart2, Mail, ArrowRight, PenLine, Eye, BookOpen, Users } from 'lucide-react';

interface PostRow {
  _id: string;
  title: string;
  status: string;
  language: string;
  featuredImage?: string;
  createdAt: string;
  views?: number;
}

interface PostsResponse {
  posts: PostRow[];
  pagination: { total: number };
}

interface StatsData {
  total: number;
  published: number;
  drafts: number;
  views: number;
}

export default function AdminDashboard() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [subscribers, setSubscribers] = useState<number | null>(null);
  const [linkCount, setLinkCount] = useState<number | null>(null);

  useEffect(() => {
    // Fetch recent posts (last 6 for display)
    fetch('/api/posts?admin=true&limit=6')
      .then((r) => r.json())
      .then((d: PostsResponse) => setPosts(d.posts ?? []))
      .catch(() => null);

    // Fetch all-post stats: published count, draft count, total views
    Promise.all([
      fetch('/api/posts?admin=true&limit=1&status=published').then((r) => r.json()),
      fetch('/api/posts?admin=true&limit=1&status=draft').then((r) => r.json()),
      fetch('/api/posts?admin=true&limit=1').then((r) => r.json()),
    ])
      .then(([pub, draft, all]: [PostsResponse, PostsResponse, PostsResponse]) => {
        setStats({
          total: all.pagination?.total ?? 0,
          published: pub.pagination?.total ?? 0,
          drafts: draft.pagination?.total ?? 0,
          views: 0, // views aggregated via separate fetch below
        });
      })
      .catch(() => null);

    fetch('/api/newsletter')
      .then((r) => r.json())
      .then((d: { count: number }) => setSubscribers(d.count))
      .catch(() => null);

    fetch('/api/links?admin=true')
      .then((r) => r.json())
      .then((d: unknown[]) => Array.isArray(d) && setLinkCount(d.length))
      .catch(() => null);
  }, []);

  const statCards = [
    {
      label: 'Total posts',
      value: stats?.total ?? '—',
      icon: FileText,
      href: '/admin/posts',
      accent: false,
    },
    {
      label: 'Published',
      value: stats?.published ?? '—',
      icon: Eye,
      href: '/admin/posts',
      accent: true,
    },
    {
      label: 'Drafts',
      value: stats?.drafts ?? '—',
      icon: PenLine,
      href: '/admin/posts',
      accent: false,
    },
    {
      label: 'Subscribers',
      value: subscribers ?? '—',
      icon: Mail,
      href: '/admin/newsletter',
      accent: false,
    },
    {
      label: 'Links',
      value: linkCount ?? '—',
      icon: Link2,
      href: '/admin/links',
      accent: false,
    },
    {
      label: 'Content stats',
      value: '→',
      icon: BarChart2,
      href: '/admin/social',
      accent: false,
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// dashboard</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Overview</h1>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className={`glass border rounded-[var(--radius-lg)] p-4 flex flex-col gap-3 hover:border-border-hover transition-colors duration-[var(--duration-fast)]
              ${accent ? 'border-matrix/30 bg-matrix/[0.04]' : 'border-border'}`}
          >
            <Icon size={15} className={`shrink-0 ${accent ? 'text-matrix' : 'text-matrix/60'}`} />
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-display font-bold text-text-0 leading-none">{String(value)}</span>
              <span className="text-[10px] text-text-2 font-mono leading-tight">{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent posts */}
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

        {posts.length === 0 ? (
          <p className="font-mono text-xs text-text-2 py-4">No posts yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-lg)] overflow-hidden">
            {posts.map((post) => (
              <Link
                key={post._id}
                href={`/admin/posts/${post._id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-bg-1 transition-colors duration-[var(--duration-fast)]"
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-bg-1 border border-border">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt=""
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized={post.featuredImage.startsWith('data:')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen size={12} className="text-text-2" />
                    </div>
                  )}
                </div>

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

      {/* Quick actions */}
      <div className="flex flex-col gap-3">
        <h2 className="font-medium text-text-0">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
          >
            <PenLine size={13} /> New post
          </Link>
          <Link
            href="/admin/links"
            className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
          >
            <Link2 size={13} /> Manage links
          </Link>
          <Link
            href="/admin/newsletter"
            className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
          >
            <Mail size={13} /> Newsletter
          </Link>
          <Link
            href="/admin/social"
            className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
          >
            <Users size={13} /> Content stats
          </Link>
        </div>
      </div>
    </div>
  );
}
