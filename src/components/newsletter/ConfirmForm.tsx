'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Posts the confirmation once the page has loaded in a real browser. Mail
 * scanners fetch the link but do not run scripts, so they never confirm.
 */
export default function ConfirmForm({ email, token, lang, label, working }: { email: string; token: string; lang: string; label: string; working: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setBusy(true);
      ref.current?.submit();
    }, 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <form ref={ref} method="post" action="/api/newsletter/confirm" onSubmit={() => setBusy(true)}>
      <input type="hidden" name="e" value={email} />
      <input type="hidden" name="t" value={token} />
      <input type="hidden" name="l" value={lang} />
      <button
        type="submit"
        disabled={busy}
        className="h-11 rounded-[var(--radius-md)] bg-matrix px-6 text-sm font-semibold text-bg-0 transition-colors hover:bg-matrix/90 disabled:opacity-60"
      >
        {busy ? working : label}
      </button>
    </form>
  );
}
