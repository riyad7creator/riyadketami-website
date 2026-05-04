import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { ZodError } from 'zod';

export async function requireAdmin(): Promise<
  { ok: true; session: Session } |
  { ok: false; response: NextResponse }
> {
  const session = (await auth()) as Session | null;
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { ok: true, session };
}

export function zodFail(error: ZodError): NextResponse {
  return NextResponse.json(
    { error: error.issues[0]?.message ?? 'Validation error' },
    { status: 400 }
  );
}

export function serverError(message: string, error: unknown): NextResponse {
  console.error(`[API] ${message}:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}
