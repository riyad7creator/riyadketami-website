import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { ZodError } from 'zod';

export async function requireAdmin(): Promise<
  { ok: true; session: Session } |
  { ok: false; response: NextResponse }
> {
  // auth() runs the Node jwt callback, which re-checks the user in the DB every
  // few minutes and returns no session for deleted or deactivated accounts.
  const session = (await auth()) as Session | null;
  if (!session?.user?.id || session.user.role !== 'admin') {
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

/** Thrown by readJson() when the request body is not valid JSON */
export class InvalidJsonError extends Error {
  constructor() {
    super('Invalid JSON body');
    this.name = 'InvalidJsonError';
  }
}

/** req.json() that throws InvalidJsonError (answered as 400 by serverError) on a malformed body */
export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new InvalidJsonError();
  }
}

/** Response for a malformed JSON body */
export function badJson(): NextResponse {
  return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
}

export function serverError(message: string, error: unknown): NextResponse {
  if (error instanceof InvalidJsonError) return badJson();
  // A malformed :id reaches Mongoose as a CastError — that's a missing
  // resource, not a server fault, so answer 404 instead of 500.
  if ((error as { name?: string })?.name === 'CastError') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  console.error(`[API] ${message}:`, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

/** Escape user input before embedding in a MongoDB $regex value */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
