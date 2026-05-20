import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <span className="font-mono text-xs text-matrix tracking-[0.2em]">// 404</span>
      <h1 className="font-display font-bold text-3xl text-text-0">Page not found</h1>
      <p className="text-text-2 text-sm">This admin page doesn&apos;t exist.</p>
      <Link
        href="/rk-studio"
        className="inline-flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
      >
        ← Dashboard
      </Link>
    </div>
  );
}
