'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  LayoutDashboard, FileText, Link2, BarChart2, Users, Mail,
  Activity, ImageIcon, Settings, Bell, Wand2, X, Check,
} from 'lucide-react';
import SignOutButton from './SignOutButton';
import { ToastProvider } from '@/components/ui/Toast';

interface AdminUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AdminShellProps {
  user: AdminUser;
  children: React.ReactNode;
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

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: Activity, exact: false },
  { href: '/admin/posts', label: 'Posts', icon: FileText, exact: false },
  { href: '/admin/links', label: 'Links', icon: Link2, exact: false },
  { href: '/admin/media', label: 'Media', icon: ImageIcon, exact: false },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail, exact: false },
  { href: '/admin/tools', label: 'AI Tools', icon: Wand2, exact: false },
  { href: '/admin/social', label: 'Content Stats', icon: BarChart2, exact: false },
  { href: '/admin/team', label: 'Team', icon: Users, exact: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
];

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

export default function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) return;
      const data = await res.json() as { notifications: Notification[]; unreadCount: number };
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silent
    }
  }, []);

  // Poll every 30s
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/admin/notifications?action=read-all', { method: 'PATCH' });
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await fetch(`/api/admin/notifications/${id}`, { method: 'PATCH' });
    setNotifications(n => n.map(x => x._id === id ? { ...x, read: true } : x));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const dismiss = async (id: string, wasUnread: boolean) => {
    await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
    setNotifications(n => n.filter(x => x._id !== id));
    if (wasUnread) setUnreadCount(c => Math.max(0, c - 1));
  };

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <ToastProvider>
      <div className="flex h-screen bg-bg-0 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-bg-1/60">
          <div className="px-5 py-5 border-b border-border">
            <span className="font-display font-bold text-text-0 tracking-tight">
              RK.<span className="text-matrix">_</span>
            </span>
            <span className="block font-mono text-[10px] text-text-2 tracking-[0.15em] mt-0.5">
              // admin
            </span>
          </div>

          <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-colors duration-[var(--duration-fast)] ${
                    active
                      ? 'bg-matrix/10 text-matrix font-medium'
                      : 'text-text-2 hover:text-text-1 hover:bg-surface'
                  }`}
                >
                  <Icon size={15} className="shrink-0" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="px-5 py-4 border-t border-border flex flex-col gap-2">
            <p className="text-xs text-text-1 font-medium truncate">{user.name ?? 'Admin'}</p>
            <p className="text-[11px] text-text-2 truncate -mt-1">{user.email}</p>
            <SignOutButton />
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top header bar */}
          <header className="h-12 shrink-0 border-b border-border bg-bg-1/40 flex items-center justify-end px-6 gap-3">
            {/* Bell */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => { setBellOpen(o => !o); if (!bellOpen) fetchNotifications(); }}
                className="relative p-1.5 rounded-[var(--radius-md)] text-text-2 hover:text-text-1 hover:bg-surface transition-colors"
                aria-label="Notifications"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 glass border border-border rounded-[var(--radius-lg)] shadow-2xl z-[var(--z-modal)] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold text-text-0">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-[11px] text-matrix hover:text-matrix/80 transition-colors"
                      >
                        <Check size={11} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-text-2 text-center">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id}
                          className={`flex gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${
                            !n.read ? 'bg-surface' : ''
                          }`}
                        >
                          <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? '🔔'}</span>
                          <div className="flex-1 min-w-0">
                            {n.link ? (
                              <Link
                                href={n.link}
                                onClick={() => { markRead(n._id); setBellOpen(false); }}
                                className="block text-xs font-medium text-text-0 hover:text-matrix transition-colors truncate"
                              >
                                {n.title}
                              </Link>
                            ) : (
                              <p className="text-xs font-medium text-text-0 truncate">{n.title}</p>
                            )}
                            <p className="text-[11px] text-text-2 mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-text-2/60 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          <button
                            onClick={() => dismiss(n._id, !n.read)}
                            className="shrink-0 p-1 text-text-2/40 hover:text-text-2 transition-colors self-start"
                            aria-label="Dismiss"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-border">
                      <Link
                        href="/admin/notifications"
                        onClick={() => setBellOpen(false)}
                        className="text-[11px] text-matrix hover:text-matrix/80 transition-colors"
                      >
                        View all notifications →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
