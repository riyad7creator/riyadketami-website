'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText, Link2, Mail, ArrowRight, PenLine, Eye, BookOpen, Users,
  TrendingUp, TrendingDown, Bell, HardDrive, Wand2,
} from 'lucide-react';

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
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface MediaStats {
  totalSizeBytes: number;
  totalFiles: number;
}

const TYPE_ICON: Record<string, string> = {
  subscriber_new: '📬',
  contact_new: '✉️',
  send_failure: '⚠️',
  storage_warning: '💾',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const STORAGE_BUDGET = 96 * 1024 * 1024;

export default function AdminDashboard() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [subscribers, setSubscribers] = useState<number | null>(null);
  const [subscribersThisWeek, setSubscribersThisWeek] = useState<number | null>(null);
  const [viewsThisWeek, setViewsThisWeek] = useState<number | null>(null);
  const [viewsLastWeek, setViewsLastWeek] = useState<number | null>(null);
  const [topPost, setTopPost] = useState<{ title: string; slug: string; views: number } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null);
  const [linkCount, setLinkCount] = useState<number | null>(null);

  useEffect(() => {
    // Recent posts
    fetch('/api/posts?admin=true&limit=6')
      .then(r => r.json())
      .then((d: PostsResponse) => setPosts(d.posts ?? []))
      .catch(() => null);

    // Post counts
    Promise.all([
      fetch('/api/posts?admin=true&limit=1&status=published').then(r => r.json()),
      fetch('/api/posts?admin=true&limit=1&status=draft').then(r => r.json()),
      fetch('/api/posts?admin=true&limit=1').then(r => r.json()),
    ]).then(([pub, draft, all]: [PostsResponse, PostsResponse, PostsResponse]) => {
      setStats({
        total: all.pagination?.total ?? 0,
        published: pub.pagination?.total ?? 0,
        drafts: draft.pagination?.total ?? 0,
      });
    }).catch(() => null);

    // Subscriber count + this week delta
    fetch('/api/newsletter').then(r => r.json()).then((d: { count: number }) => setSubscribers(d.count)).catch(() => null);

    fetch('/api/newsletter/stats').then(r => r.json()).then((d: { recentCount?: number }) => {
      if (d.recentCount !== undefined) setSubscribersThisWeek(d.recentCount);
    }).catch(() => null);

    // Analytics (views)
    fetch('/api/admin/analytics?mode=overview')
      .then(r => r.json())
      .then((d: { viewsThisWeek: number; viewsLastWeek: number; topThisWeek?: Array<{ title?: string; slug?: string; views: number }> }) => {
        setViewsThisWeek(d.viewsThisWeek);
        setViewsLastWeek(d.viewsLastWeek);
        const top = d.topThisWeek?.[0];
        if (top) setTopPost({ title: top.title ?? top.slug ?? '—', slug: top.slug ?? '', views: top.views });
      }).catch(() => null);

    // Notifications
    fetch('/api/admin/notifications')
      .then(r => r.json())
      .then((d: { notifications: Notification[]; unreadCount: number }) => {
        setNotifications(d.notifications.slice(0, 3));
        setUnreadCount(d.unreadCount);
      }).catch(() => null);

    // Media storage
    fetch('/api/admin/media?stats=true')
      .then(r => r.json())
      .then((d: MediaStats) => setMediaStats(d))
      .catch(() => null);

    // Links
    fetch('/api/links?admin=true')
      .then(r => r.json())
      .then((d: unknown[]) => Array.isArray(d) && setLinkCount(d.length))
      .catch(() => null);
  }, []);

  const viewsDelta = viewsLastWeek && viewsLastWeek > 0 && viewsThisWeek !== null
    ? Math.round(((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100)
    : null;

  const storageUsedPct = mediaStats ? Math.min(100, (mediaStats.totalSizeBytes / STORAGE_BUDGET) * 100) : 0;

  const statCards = [
    { label: 'Published posts', value: stats?.published ?? '—', icon: Eye, href: '/admin/posts', accent: true },
    { label: 'Drafts', value: stats?.drafts ?? '—', icon: PenLine, href: '/admin/posts', accent: false },
    { label: 'Subscribers', value: subscribers ?? '—', icon: Mail, href: '/admin/newsletter', accent: false },
    { label: 'Links', value: linkCount ?? '—', icon: Link2, href: '/admin/links', accent: false },
    { label: 'Views this week', value: viewsThisWeek ?? '—', icon: TrendingUp, href: '/admin/analytics/posts', accent: false },
    { label: 'AI Tools', value: '→', icon: Wand2, href: '/admin/tools', accent: false },
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

      {/* Secondary row: views delta + subscribers delta + top post + storage */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Views delta */}
        <div className="glass border border-border rounded-[var(--radius-lg)] p-4">
          <p className="text-[10px] font-mono text-text-2 mb-2">Views vs last week</p>
          {viewsDelta !== null ? (
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${viewsDelta >= 0 ? 'text-matrix' : 'text-danger'}`}>
              {viewsDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {viewsDelta >= 0 ? '+' : ''}{viewsDelta}%
            </div>
          ) : (
            <span className="text-sm text-text-2">—</span>
          )}
        </div>

        {/* Subscribers this week */}
        <div className="glass border border-border rounded-[var(--radius-lg)] p-4">
          <p className="text-[10px] font-mono text-text-2 mb-2">New subscribers</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-display font-bold text-text-0">
              {subscribersThisWeek !== null ? `+${subscribersThisWeek}` : '—'}
            </span>
            <span className="text-[10px] text-text-2">this week</span>
          </div>
        </div>

        {/* Top post this week */}
        <div className="glass border border-border rounded-[var(--radius-lg)] p-4">
          <p className="text-[10px] font-mono text-text-2 mb-2">Top post this week</p>
          {topPost ? (
            <Link href={`/admin/posts`} className="block">
              <p className="text-xs text-text-0 font-medium truncate hover:text-matrix transition-colors">{topPost.title}</p>
              <p className="text-[10px] text-matrix font-mono mt-0.5">{topPost.views} views</p>
            </Link>
          ) : (
            <span className="text-sm text-text-2">—</span>
          )}
        </div>

        {/* Storage */}
        <div className="glass border border-border rounded-[var(--radius-lg)] p-4">
          <p className="text-[10px] font-mono text-text-2 mb-2 flex items-center gap-1">
            <HardDrive size={10} /> Storage
          </p>
          {mediaStats ? (
            <>
              <p className="text-sm font-mono text-text-0">{fmtBytes(mediaStats.totalSizeBytes)}</p>
              <div className="w-full bg-bg-1 rounded-full h-1 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${storageUsedPct > 85 ? 'bg-danger' : storageUsedPct > 60 ? 'bg-amber-400' : 'bg-matrix'}`}
                  style={{ width: `${storageUsedPct}%` }}
                />
              </div>
              <p className="text-[10px] text-text-2 mt-1">{storageUsedPct.toFixed(0)}% of ~96 MB</p>
            </>
          ) : (
            <span className="text-sm text-text-2">—</span>
          )}
        </div>
      </div>

      {/* Notifications preview */}
      {notifications.length > 0 && (
        <div className="glass border border-border rounded-[var(--radius-lg)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="font-medium text-text-0 flex items-center gap-2">
              <Bell size={13} className="text-matrix/60" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-[10px] bg-danger text-white px-1.5 py-0.5 rounded-full font-mono">{unreadCount} unread</span>
              )}
            </h2>
          </div>
          {notifications.map(n => (
            <div key={n._id} className={`flex items-start gap-3 px-5 py-3 border-b border-border/50 last:border-0 ${!n.read ? 'bg-surface' : ''}`}>
              <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-0 truncate">{n.title}</p>
                <p className="text-[11px] text-text-2 mt-0.5 line-clamp-1">{n.body}</p>
              </div>
              <span className="text-[10px] text-text-2/60 shrink-0">{timeAgo(n.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent posts */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-text-0">Recent posts</h2>
          <Link href="/rk-studio/posts" className="flex items-center gap-1.5 text-xs font-mono text-matrix hover:gap-2.5 transition-all duration-[var(--duration-fast)]">
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
                {post.views !== undefined && post.views > 0 && (
                  <span className="text-[10px] font-mono text-text-2 shrink-0">{post.views} views</span>
                )}
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-2 shrink-0">{post.language}</span>
                <span className={`font-mono text-[10px] uppercase tracking-widest shrink-0 ${post.status === 'published' ? 'text-matrix' : 'text-text-2'}`}>
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
          <Link href="/rk-studio/posts/new" className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]">
            <PenLine size={13} /> New post
          </Link>
          <Link href="/rk-studio/links" className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]">
            <Link2 size={13} /> Manage links
          </Link>
          <Link href="/rk-studio/newsletter" className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]">
            <Mail size={13} /> Newsletter
          </Link>
          <Link href="/rk-studio/tools" className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]">
            <Wand2 size={13} /> AI Tools
          </Link>
          <Link href="/rk-studio/social" className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]">
            <Users size={13} /> Content stats
          </Link>
        </div>
      </div>
    </div>
  );
}
