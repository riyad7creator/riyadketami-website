import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 | Page not found',
};

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-bg-0 px-5 text-center">
      <div className="relative flex flex-col items-center gap-6 max-w-md">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-signal">Error 404</span>

        <h1
          className="font-display font-bold tracking-tight text-text-0 leading-none"
          style={{ fontSize: 'clamp(5rem, 18vw, 10rem)' }}
        >
          404
        </h1>

        <p className="text-text-1 text-lg">
          This page doesn&apos;t exist. Or it moved.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/en"
            className="px-5 py-2.5 bg-signal text-ink text-sm font-medium inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/en/contact"
            className="inline-flex min-h-[44px] items-center px-5 py-2.5 border border-line text-sm font-medium text-paper rounded-[var(--radius-md)] hover:border-paper/60 transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}
