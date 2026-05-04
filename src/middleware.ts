import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale, isValidLocale } from '@/i18n/config';

const PUBLIC_FILE = /\.(.*)$/;

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const preferred = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
  if (preferred && isValidLocale(preferred)) return preferred;
  return defaultLocale;
}

export default auth(function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next.js internals, API routes, and auth routes
  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/admin')
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a valid locale
  const pathnameLocale = pathname.split('/')[1];
  if (pathnameLocale && isValidLocale(pathnameLocale)) {
    const locale = pathnameLocale;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', locale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Redirect to locale-prefixed path
  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);
  return NextResponse.redirect(newUrl);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
