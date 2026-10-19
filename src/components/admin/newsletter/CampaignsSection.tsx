'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart2, TrendingUp } from 'lucide-react';
import { pct } from './ui';

interface CampaignRow {
  _id: string;
  subject: string;
  status?: string;
  origin?: string;
  sentAt?: string;
  scheduledAt?: string;
  createdAt: string;
  recipientCount: number;
  deliveredCount?: number;
  uniqueOpenCount?: number;
  uniqueClickCount?: number;
  bounceCount?: number;
  complaintCount?: number;
  editions?: { lang: string; status?: string; fallback?: boolean }[];
}
interface GrowthDay { _id: string; count: number }
interface SourceRow { _id: string | null; count: number }

const STATUS_STYLE: Record<string, string> = {
  draft: 'border-border text-text-2',
  scheduled: 'border-matrix/40 text-matrix',
  sending: 'border-warning/40 text-warning',
  sent: 'border-matrix/40 bg-matrix/10 text-matrix',
  failed: 'border-danger/40 text-danger',
};

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

export default function CampaignsSection() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [growth, setGrowth] = useState<GrowthDay[]>([]);
  const [sourceSplit, setSourceSplit] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'campaigns' | 'growth'>('campaigns');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/newsletter/campaigns').then((r) => r.json() as Promise<{ campaigns?: CampaignRow[] }>),
      fetch('/api/admin/campaigns').then((r) => r.json() as Promise<{ growth?: GrowthDay[]; sourceSplit?: SourceRow[] }>),
    ])
      .then(([c, g]) => {
        setCampaigns(c.campaigns ?? []);
        setGrowth(g.growth ?? []);
        setSourceSplit(g.sourceSplit ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const maxGrowth = Math.max(...growth.map((d) => d.count), 1);
  const sourceTotal = sourceSplit.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-text-0 flex items-center gap-2">
          <BarChart2 size={14} className="text-matrix" /> Campaigns and growth
        </h2>
        <div className="flex gap-1">
          {(['campaigns', 'growth'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-2.5 py-1 text-xs rounded-full transition-colors ${tab === t ? 'bg-matrix text-bg-0' : 'text-text-2 hover:text-text-1'}`}>
              {t === 'campaigns' ? 'Campaigns' : 'Growth'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-text-2 py-4">Loading...</p>
      ) : tab === 'campaigns' ? (
        campaigns.length === 0 ? (
          <p className="text-xs text-text-2 py-4">No campaigns yet. Press New campaign to write the first issue.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border border border-border rounded-[var(--radius-lg)] overflow-hidden">
            {campaigns.map((c) => {
              const status = c.status ?? (c.sentAt ? 'sent' : 'draft');
              const langs = (c.editions ?? []).filter((e) => !e.fallback).map((e) => e.lang.toUpperCase()).join(' ');
              const reached = c.recipientCount;
              return (
                <Link key={c._id} href={`/rk-studio/newsletter/campaigns/${c._id}`} className="px-4 py-3 flex flex-col gap-1.5 hover:bg-surface/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-mono ${STATUS_STYLE[status] ?? STATUS_STYLE.draft}`}>{status}</span>
                    {c.origin === 'digest' && <span className="shrink-0 text-[10px] font-mono text-text-2">digest</span>}
                    <span className="flex-1 text-sm text-text-0 truncate">{c.subject}</span>
                    {langs && <span className="shrink-0 font-mono text-[10px] text-text-2">{langs}</span>}
                    <span className="shrink-0 text-xs text-text-2">{fmtDate(status === 'scheduled' ? c.scheduledAt : c.sentAt ?? c.createdAt)}</span>
                  </div>
                  {(status === 'sent' || status === 'scheduled' || status === 'failed') && reached > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-text-2">
                      <span>{reached} recipients</span>
                      <span>{c.deliveredCount ?? 0} delivered</span>
                      <span className="text-text-1">{pct(c.uniqueClickCount, reached)} clicked</span>
                      <span title="Inflated by Apple Mail privacy: use clicks to judge">{pct(c.uniqueOpenCount, reached)} opened</span>
                      {(c.bounceCount ?? 0) > 0 && <span>{c.bounceCount} bounced</span>}
                      {(c.complaintCount ?? 0) > 0 && <span className="text-danger">{c.complaintCount} spam reports</span>}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {growth.length > 0 ? (
            <div className="glass border border-border rounded-[var(--radius-lg)] p-4">
              <p className="text-xs text-text-2 mb-3 flex items-center gap-1.5"><TrendingUp size={12} /> Confirmed subscribers per day (last 30 days)</p>
              <div className="flex items-end gap-0.5 h-16">
                {growth.map((d) => (
                  <div key={d._id} className="flex-1 bg-matrix/60 rounded-t min-h-[2px] hover:bg-matrix transition-colors" style={{ height: `${Math.max(4, (d.count / maxGrowth) * 100)}%` }} title={`${d._id}: ${d.count}`} />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-text-2 mt-1">
                <span>{growth[0]?._id}</span>
                <span>{growth[growth.length - 1]?._id}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-2 py-2">No new confirmed subscribers in the last 30 days.</p>
          )}
          {sourceSplit.length > 0 && (
            <div className="glass border border-border rounded-[var(--radius-lg)] p-4 space-y-2">
              <p className="text-xs font-semibold text-text-0">Where active subscribers came from (UTM source, else the form)</p>
              {sourceSplit.map((s) => {
                const p = sourceTotal > 0 ? Math.round((s.count / sourceTotal) * 100) : 0;
                return (
                  <div key={s._id ?? 'unknown'} className="flex items-center gap-3">
                    <span className="w-28 text-xs text-text-2 font-mono truncate shrink-0">{s._id ?? 'unknown'}</span>
                    <div className="flex-1 bg-bg-1 rounded-full h-1.5 overflow-hidden"><div className="h-full bg-matrix rounded-full" style={{ width: `${p}%` }} /></div>
                    <span className="text-xs text-text-1 w-16 text-right font-mono shrink-0">{s.count} ({p}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
