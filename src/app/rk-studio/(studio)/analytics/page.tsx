import Link from 'next/link';
import { ExternalLink, BarChart2 } from 'lucide-react';

const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID ?? '';
const clarityBase = `https://clarity.microsoft.com/projects/view/${clarityId}`;

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// analytics</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">Analytics</h1>
      </div>

      {/* Post Analytics link (data from this site's own database) */}
      <Link
        href="/rk-studio/analytics/posts"
        className="glass border border-matrix/30 rounded-[var(--radius-lg)] p-4 flex items-center gap-3 hover:border-matrix/60 transition-colors group"
      >
        <BarChart2 size={18} className="text-matrix shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-0">Post Analytics</p>
          <p className="text-xs text-text-2">Top posts, view trends, language split, translation gaps</p>
        </div>
      </Link>

      {/* Microsoft Clarity: its dashboard refuses to load inside an iframe, so link out */}
      {clarityId ? (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-display font-semibold text-text-0">Sessions, heatmaps and recordings</h2>
            <p className="text-xs text-text-2 mt-1">
              Traffic numbers live in Microsoft Clarity. It cannot be embedded here (Clarity blocks
              iframes), so it opens in a new tab.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`${clarityBase}/dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
            >
              <ExternalLink size={13} /> Open Clarity dashboard
            </a>
            <a
              href={`${clarityBase}/heatmaps`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
            >
              Heatmaps
            </a>
            <a
              href={`${clarityBase}/recordings`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
            >
              Session recordings
            </a>
          </div>
        </div>
      ) : (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-10 text-center flex flex-col items-center gap-4">
          <span className="font-mono text-xs text-text-2 tracking-[0.15em]">// not configured</span>
          <p className="text-sm text-text-1">
            Add <code className="font-mono text-matrix bg-bg-1 px-1 rounded">NEXT_PUBLIC_CLARITY_ID</code> to your environment variables to enable analytics.
          </p>
          <ol className="text-left text-sm text-text-2 space-y-1">
            <li>1. Go to <a href="https://clarity.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-matrix hover:underline">clarity.microsoft.com</a></li>
            <li>2. New project, Website, URL: ketami.net</li>
            <li>3. Copy the Project ID</li>
            <li>4. Add <code className="font-mono text-matrix">NEXT_PUBLIC_CLARITY_ID=your-id</code> to the Vercel environment</li>
            <li>5. Redeploy: heatmaps start collecting within 24h</li>
          </ol>
        </div>
      )}
    </div>
  );
}
