'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormField, Button } from '@/components/ui';
import Eyebrow from '@/components/ui/Eyebrow';

const LOGIN_MESSAGES: Record<string, string> = {
  rate_limited: 'Too many failed attempts for this account from your network. Wait 15 minutes and try again.',
  invalid_credentials: 'Email or password is incorrect.',
  credentials: 'Email or password is incorrect.',
};

/** Only same-site studio paths are allowed as a return target (no open redirect). */
function safeCallbackUrl(raw: string | null): string {
  if (!raw) return '/rk-studio';
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return '/rk-studio';
    if (!url.pathname.startsWith('/rk-studio') || url.pathname.startsWith('/rk-studio/auth')) return '/rk-studio';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/rk-studio';
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const callbackUrl = safeCallbackUrl(new URLSearchParams(window.location.search).get('callbackUrl'));
    let result: Awaited<ReturnType<typeof signIn>> | undefined;
    try {
      result = await signIn('credentials', {
        email: String(fd.get('email') ?? '').trim(),
        password: String(fd.get('password') ?? ''),
        redirect: false,
        callbackUrl,
      });
    } catch {
      setLoading(false);
      setError('Could not reach the server. Check your connection and try again.');
      return;
    }

    setLoading(false);
    if (result?.error) {
      setError(LOGIN_MESSAGES[result.code ?? ''] ?? LOGIN_MESSAGES.invalid_credentials ?? 'Sign in failed.');
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-5">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Eyebrow>Admin access</Eyebrow>
          <h1 className="font-display font-bold text-3xl text-text-0 tracking-tight">Sign in</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <FormField
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />

          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-danger">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  );
}
