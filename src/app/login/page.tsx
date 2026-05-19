'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormField, Button } from '@/components/ui';
import MatrixText from '@/components/ui/MatrixText';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      const raw = String(result.error);
      const msg = raw.includes('locked')
        ? 'Account temporarily locked. Try again in 2 hours.'
        : raw.toLowerCase().includes('too many')
          ? 'Too many login attempts. Wait a minute and try again.'
          : 'Invalid credentials.';
      setError(msg);
    } else {
      router.push('/admin');
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-5">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <MatrixText text="// admin access" className="text-xs tracking-[0.2em] text-matrix" autoPlay />
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
