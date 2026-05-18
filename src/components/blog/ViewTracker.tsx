'use client';

import { useEffect } from 'react';

interface ViewTrackerProps {
  slug: string;
}

/**
 * Fires a POST to /api/posts/[slug]/view on mount.
 * This is a client component so it runs on every real page visit
 * even when the surrounding server component is served from ISR cache.
 */
export default function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    fetch(`/api/posts/${encodeURIComponent(slug)}/view`, { method: 'POST' }).catch(() => {});
  }, [slug]);

  return null;
}
