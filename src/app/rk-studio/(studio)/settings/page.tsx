import Link from 'next/link';
import { ImageIcon, Zap, ChevronRight } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// settings</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Settings</h1>
        <p className="text-sm text-text-2 mt-1">Configure AI and find where sitewide content is edited.</p>
      </div>

      {/* Sub-section nav cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link
          href="/rk-studio/settings/ai"
          className="glass border border-border rounded-[var(--radius-lg)] p-4 flex items-center gap-3 hover:border-matrix/30 transition-colors group"
        >
          <div className="p-2 bg-surface rounded-[var(--radius-md)] shrink-0 group-hover:bg-matrix/10 transition-colors">
            <Zap size={15} className="text-text-2 group-hover:text-matrix transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-0">AI Settings</p>
            <p className="text-xs text-text-2 mt-0.5">OpenRouter key, models, usage</p>
          </div>
          <ChevronRight size={14} className="text-text-2 shrink-0" />
        </Link>

        <Link
          href="/rk-studio/content"
          className="glass border border-border rounded-[var(--radius-lg)] p-4 flex items-center gap-3 hover:border-matrix/30 transition-colors group"
        >
          <div className="p-2 bg-surface rounded-[var(--radius-md)] shrink-0 group-hover:bg-matrix/10 transition-colors">
            <ImageIcon size={15} className="text-text-2 group-hover:text-matrix transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-0">Site images, texts and links</p>
            <p className="text-xs text-text-2 mt-0.5">Managed in Content</p>
          </div>
          <ChevronRight size={14} className="text-text-2 shrink-0" />
        </Link>
      </div>

      <p className="text-xs text-text-2 border border-border rounded-[var(--radius-md)] px-4 py-3">
        The hero image, profile picture and every other public image are edited in{' '}
        <Link href="/rk-studio/content" className="text-matrix hover:underline">Content</Link>
        {' '}(Images tab). The old image settings here were not read by the site, so they were removed.
      </p>
    </div>
  );
}
