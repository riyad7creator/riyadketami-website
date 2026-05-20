'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotifResponse {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

const TYPE_ICON: Record<string, string> = {
  subscriber_new: '📬',
  contact_new: '✉️',
  send_failure: '⚠️',
  storage_warning: '💾',
};

const TYPE_LABEL: Record<string, string> = {
  subscriber_new: 'New subscriber',
  contact_new: 'Contact form',
  send_failure: 'Send failure',
  storage_warning: 'Storage warning',
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

export default function NotificationsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<NotifResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications?all=true');
      if (res.ok) setData(await res.json() as NotifResponse);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const markAllRead = async () => {
    setActionLoading('all-read');
    try {
      await fetch('/api/admin/notifications?action=read-all', { method: 'PATCH' });
      setData(d => d ? { ...d, notifications: d.notifications.map(n => ({ ...n, read: true })), unreadCount: 0 } : d);
      toast('All marked as read', 'success');
    } catch {
      toast('Failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const markRead = async (id: string) => {
    await fetch(`/api/admin/notifications/${id}`, { method: 'PATCH' });
    setData(d => d ? {
      ...d,
      notifications: d.notifications.map(n => n._id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, d.unreadCount - 1),
    } : d);
  };

  const deleteOne = async (id: string, wasUnread: boolean) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
      setData(d => d ? {
        ...d,
        notifications: d.notifications.filter(n => n._id !== id),
        unreadCount: wasUnread ? Math.max(0, d.unreadCount - 1) : d.unreadCount,
        total: d.total - 1,
      } : d);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAll = async () => {
    if (!confirm('Delete all notifications?')) return;
    setActionLoading('delete-all');
    try {
      const ids = data?.notifications.map(n => n._id) ?? [];
      await Promise.all(ids.map(id => fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' })));
      setData(d => d ? { ...d, notifications: [], unreadCount: 0, total: 0 } : d);
      toast('All notifications deleted', 'success');
    } catch {
      toast('Failed to delete all', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const allTypes = data
    ? ['all', ...Array.from(new Set(data.notifications.map(n => n.type)))]
    : ['all'];

  const filtered = data?.notifications.filter(n =>
    filterType === 'all' || n.type === filterType
  ) ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="font-mono text-xs text-matrix tracking-[0.15em]">// notifications</span>
          <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Notifications</h1>
          {data && (
            <p className="text-xs text-text-2 mt-1">
              {data.unreadCount > 0 ? (
                <span className="text-matrix font-medium">{data.unreadCount} unread</span>
              ) : (
                'All caught up'
              )}
              {' '}· {data.total} total
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {(data?.unreadCount ?? 0) > 0 && (
            <button
              onClick={markAllRead}
              disabled={actionLoading === 'all-read'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 glass border border-border text-text-1 text-xs rounded-[var(--radius-md)] hover:border-matrix/40 hover:text-matrix transition-colors disabled:opacity-40"
            >
              {actionLoading === 'all-read' ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
              Mark all read
            </button>
          )}
          {(data?.total ?? 0) > 0 && (
            <button
              onClick={deleteAll}
              disabled={actionLoading === 'delete-all'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 glass border border-border text-text-2 text-xs rounded-[var(--radius-md)] hover:border-danger/40 hover:text-danger transition-colors disabled:opacity-40"
            >
              {actionLoading === 'delete-all' ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Delete all
            </button>
          )}
        </div>
      </div>

      {/* Type filter */}
      {allTypes.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {allTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-xs font-mono rounded-full border transition-colors ${
                filterType === type
                  ? 'bg-matrix text-bg-0 border-matrix'
                  : 'border-border text-text-2 hover:border-matrix/40 hover:text-text-1'
              }`}
            >
              {type === 'all' ? 'All' : (TYPE_LABEL[type] ?? type)}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 text-text-2">
          <Loader2 size={16} className="animate-spin text-matrix" />
          <span className="font-mono text-xs">Loading notifications…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass border border-border rounded-[var(--radius-lg)] py-16 flex flex-col items-center gap-3 text-center">
          <Bell size={28} className="text-text-2/30" />
          <p className="text-sm text-text-2">No notifications{filterType !== 'all' ? ' of this type' : ''}.</p>
        </div>
      ) : (
        <div className="glass border border-border rounded-[var(--radius-lg)] overflow-hidden">
          {filtered.map((n, idx) => (
            <div
              key={n._id}
              className={`flex items-start gap-3 px-5 py-4 transition-colors ${
                idx < filtered.length - 1 ? 'border-b border-border/50' : ''
              } ${!n.read ? 'bg-surface' : 'hover:bg-bg-1/30'}`}
            >
              <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>

              <div className="flex-1 min-w-0">
                {n.link ? (
                  <Link
                    href={n.link}
                    onClick={() => { if (!n.read) void markRead(n._id); }}
                    className="text-sm font-medium text-text-0 hover:text-matrix transition-colors"
                  >
                    {n.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-text-0">{n.title}</p>
                )}
                <p className="text-xs text-text-2 mt-0.5">{n.body}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-mono text-text-2/50">{timeAgo(n.createdAt)}</span>
                  <span className="text-[10px] font-mono text-text-2/40 uppercase tracking-wider">{TYPE_LABEL[n.type] ?? n.type}</span>
                  {!n.read && (
                    <span className="text-[10px] font-mono bg-matrix/10 text-matrix px-1.5 py-0.5 rounded-full">unread</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <button
                    onClick={() => void markRead(n._id)}
                    className="p-1.5 text-text-2/50 hover:text-matrix transition-colors"
                    title="Mark as read"
                  >
                    <Check size={13} />
                  </button>
                )}
                <button
                  onClick={() => void deleteOne(n._id, !n.read)}
                  disabled={actionLoading === n._id}
                  className="p-1.5 text-text-2/50 hover:text-danger transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  {actionLoading === n._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
