import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, isValidLocale } from '@/i18n/config';

const { auth } = NextAuth(authConfig);

const PUBLIC_FILE = /\.(.*)$/;

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language') ?? '';
  const preferred = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
  if (preferred && isValidLocale(preferred)) return preferred;
  return defaultLocale;
}

export default auth(function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/links') ||
    pathname.startsWith('/design-system')
  ) {
    return NextResponse.next();
  }

  const pathnameLocale = pathname.split('/')[1];
  if (pathnameLocale && isValidLocale(pathnameLocale)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', pathnameLocale);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);
  return NextResponse.redirect(newUrl);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
