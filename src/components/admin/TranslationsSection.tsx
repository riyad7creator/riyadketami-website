'use client';

import { useEffect, useState, useCallback } from 'react';
import TranslationCard, { type TranslationInfo } from './TranslationCard';

interface EnPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  updatedAt: string;
}

interface TranslationsSectionProps {
  postId: string;
  enPost: EnPost;
  /** Increment to force a re-fetch (e.g. after auto-translate on publish) */
  refreshKey?: number;
}

export default function TranslationsSection({ postId, enPost, refreshKey = 0 }: TranslationsSectionProps) {
  const [fr, setFr] = useState<TranslationInfo | null>(null);
  const [ar, setAr] = useState<TranslationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/translate-post?postId=${postId}`);
      if (res.ok) {
        const data = await res.json() as TranslationInfo[];
        setFr(data.find((t) => t.language === 'fr') ?? null);
        setAr(data.find((t) => t.language === 'ar') ?? null);
      }
    } catch {
      // silent — show missing
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  return (
    <div className="flex flex-col gap-4 pt-4 border-t border-border">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// translations</span>
        <h2 className="font-display font-semibold text-lg text-text-0 mt-0.5">Translations</h2>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-text-2 py-2">Loading translations...</p>
      ) : (
        <div className="flex flex-col gap-3">
          <TranslationCard lang="fr" enPost={enPost} translation={fr} onRefresh={() => void load()} />
          <TranslationCard lang="ar" enPost={enPost} translation={ar} onRefresh={() => void load()} />
        </div>
      )}
    </div>
  );
}
