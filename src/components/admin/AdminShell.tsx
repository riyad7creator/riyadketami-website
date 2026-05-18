'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Link2, BarChart2, Users, Mail, Activity, ImageIcon, Settings } from 'lucide-react';
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

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: Activity, exact: false },
  { href: '/admin/posts', label: 'Posts', icon: FileText, exact: false },
  { href: '/admin/links', label: 'Links', icon: Link2, exact: false },
  { href: '/admin/media', label: 'Media', icon: ImageIcon, exact: false },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Mail, exact: false },
  { href: '/admin/social', label: 'Content Stats', icon: BarChart2, exact: false },
  { href: '/admin/team', label: 'Team', icon: Users, exact: false },
  { href: '/admin/settings', label: 'Settings', icon: Settings, exact: false },
];

export default function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();

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

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
