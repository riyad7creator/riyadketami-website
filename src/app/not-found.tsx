import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 — Page not found',
};

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-bg-0 px-5 text-center">
      {/* Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,255,102,0.06) 0%, transparent 70%)' }}
        aria-hidden
      />

      <div className="relative flex flex-col items-center gap-6 max-w-md">
        <span className="font-mono text-[10px] tracking-[0.25em] text-matrix">// error_404</span>

        <h1
          className="font-display font-bold tracking-tight text-text-0 leading-none"
          style={{ fontSize: 'clamp(5rem, 18vw, 10rem)' }}
        >
          404
        </h1>

        <p className="text-text-1 text-lg">
          This page doesn&apos;t exist — or it moved.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/en"
            className="px-5 py-2.5 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/en/contact"
            className="px-5 py-2.5 glass text-sm font-medium text-text-1 rounded-[var(--radius-md)] hover:border-matrix/40 hover:text-text-0 transition-all"
          >
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}
