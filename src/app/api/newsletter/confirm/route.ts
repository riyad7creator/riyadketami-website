import { NextResponse } from 'next/server';
import { verifyConfirmToken } from '@/lib/newsletter-tokens';
import { confirmSubscriber } from '@/lib/newsletter/lifecycle';
import { isNlLang } from '@/lib/newsletter/config';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/newsletter/confirm (form: e, t, l): the double opt-in click.
 * The email link opens /<lang>/newsletter/confirm, which posts here, so mail
 * scanners that prefetch links cannot confirm on someone's behalf.
 */
export async function POST(req: Request) {
  const limited = await rateLimit(req, 20, 60_000, 'newsletter-confirm-post');
  if (limited) return limited;

  let email = '';
  let token = '';
  let lang = 'en';
  try {
    const form = await req.formData();
    email = String(form.get('e') ?? '').toLowerCase().trim();
    token = String(form.get('t') ?? '');
    const l = String(form.get('l') ?? '');
    if (isNlLang(l)) lang = l;
  } catch {
    // not a form post
  }

  const fail = () => NextResponse.redirect(new URL(`/${lang}/newsletter/confirm?error=invalid`, req.url), 303);
  if (!email || !token || !verifyConfirmToken(email, token)) return fail();

  const result = await confirmSubscriber(email);
  if (!result) return fail();
  return NextResponse.redirect(new URL(`/${result.lang}/newsletter/confirmed`, req.url), 303);
}
