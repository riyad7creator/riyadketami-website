'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-bg-0 px-5 text-center">
      <div className="relative flex flex-col items-center gap-6 max-w-md">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-danger">Runtime error</span>

        <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight text-text-0">
          Something broke.
        </h1>

        <p className="text-text-2 text-base">
          An unexpected error occurred. Try refreshing. If it persists, contact support.
        </p>

        <button
          onClick={reset}
          className="px-5 py-2.5 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
