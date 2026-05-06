'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
}

interface NewsletterResponse {
  subscribers: Subscriber[];
  total: number;
}

export default function AdminNewsletterPage() {
  const [data, setData] = useState<NewsletterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/newsletter/subscribers?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((d: NewsletterResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page]);

  const handleExport = () => {
    if (!data) return;
    const csv = 'email,joined\n' + data.subscribers
      .map((s) => `${s.email},${new Date(s.createdAt).toISOString().slice(0, 10)}`)
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-matrix tracking-[0.15em]">// email list</span>
          <h1 className="font-display font-bold text-2xl text-text-0 mt-1">
            Newsletter subscribers
            {data && (
              <span className="font-mono text-sm text-matrix ml-3">{data.total.toLocaleString()}</span>
            )}
          </h1>
        </div>
        <button
          onClick={handleExport}
          disabled={!data || data.subscribers.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-text-2 py-8">Loading...</p>
      ) : !data || data.subscribers.length === 0 ? (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-10 text-center">
          <p className="font-mono text-xs text-text-2">No subscribers yet.</p>
          <p className="text-sm text-text-2 mt-2">Share the newsletter form on your home page to start collecting emails.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-lg)] overflow-hidden">
            {data.subscribers.map((sub) => (
              <div key={sub._id} className="flex items-center gap-4 px-5 py-3">
                <span className="flex-1 text-sm text-text-1 truncate">{sub.email}</span>
                <span className="font-mono text-xs text-text-2 shrink-0">
                  {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 glass border border-border text-sm text-text-1 rounded-[var(--radius-sm)] disabled:opacity-40 hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
              >
                ← Prev
              </button>
              <span className="font-mono text-xs text-text-2">{page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 glass border border-border text-sm text-text-1 rounded-[var(--radius-sm)] disabled:opacity-40 hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
