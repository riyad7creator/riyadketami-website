'use client';

import { useEffect } from 'react';

/**
 * Disables the browser's scroll-position restoration on reload/back-forward.
 * Without this, reloading a page where you'd scrolled to (e.g.) the newsletter
 * section snaps you straight back to it instead of starting at the top.
 */
export default function ScrollControl() {
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return null;
}
