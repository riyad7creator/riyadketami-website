'use client';

import Link from 'next/link';
import { Activity, Clock, TrendingUp, ExternalLink, BarChart2 } from 'lucide-react';

function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: React.ElementType }) {
  return (
    <div className="glass border border-border rounded-[var(--radius-lg)] p-5 flex flex-col gap-3">
      <Icon size={15} className="text-matrix/60 shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-display font-bold text-text-0">{value}</span>
        <span className="text-xs text-text-1 font-medium">{label}</span>
        <span className="text-[10px] font-mono text-text-2">{hint}</span>
      </div>
    </div>
  );
}

const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID ?? '';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// analytics</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Analytics</h1>
      </div>

      {/* Post Analytics link */}
      <Link
        href="/admin/analytics/posts"
        className="glass border border-matrix/30 rounded-[var(--radius-lg)] p-4 flex items-center gap-3 hover:border-matrix/60 transition-colors group"
      >
        <BarChart2 size={18} className="text-matrix shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-0">Post Analytics →</p>
          <p className="text-xs text-text-2">Top posts, view trends, language split, translation gaps</p>
        </div>
      </Link>

      {/* Quick stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Sessions this week" value="—" hint="Via Clarity" icon={Activity} />
        <StatCard label="Avg. time on site" value="—" hint="Via Clarity" icon={Clock} />
        <StatCard label="Most visited page" value="—" hint="Via Clarity" icon={TrendingUp} />
      </div>

      {/* Open in Clarity */}
      <div className="flex items-center gap-3">
        <a
          href={`https://clarity.microsoft.com/projects/view/${clarityId}/dashboard`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
        >
          <ExternalLink size={13} /> Open Clarity Dashboard
        </a>
        <a
          href={`https://clarity.microsoft.com/projects/view/${clarityId}/heatmaps`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
        >
          Heatmaps →
        </a>
        <a
          href={`https://clarity.microsoft.com/projects/view/${clarityId}/recordings`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
        >
          Session recordings →
        </a>
      </div>

      {/* Embedded Clarity dashboard */}
      {clarityId ? (
        <div className="rounded-[var(--radius-lg)] border border-border overflow-hidden" style={{ height: '700px' }}>
          <iframe
            src={`https://clarity.microsoft.com/projects/view/${clarityId}/dashboard`}
            className="w-full h-full"
            title="Microsoft Clarity Analytics"
          />
        </div>
      ) : (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-10 text-center flex flex-col items-center gap-4">
          <span className="font-mono text-xs text-text-2 tracking-[0.15em]">// not configured</span>
          <p className="text-sm text-text-1">
            Add <code className="font-mono text-matrix bg-bg-1 px-1 rounded">NEXT_PUBLIC_CLARITY_ID</code> to your environment variables to enable analytics.
          </p>
          <ol className="text-left text-sm text-text-2 space-y-1">
            <li>1. Go to <a href="https://clarity.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-matrix hover:underline">clarity.microsoft.com</a></li>
            <li>2. New project → Website → URL: ketami.net</li>
            <li>3. Copy the Project ID</li>
            <li>4. Add <code className="font-mono text-matrix">NEXT_PUBLIC_CLARITY_ID=your-id</code> to .env.local</li>
            <li>5. Redeploy — heatmaps start collecting within 24h</li>
          </ol>
        </div>
      )}

      <p className="font-mono text-[10px] text-text-2">
        // heatmaps and session recordings available at clarity.microsoft.com — free, unlimited sessions
      </p>
    </div>
  );
}
