import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/models/User';

/** Sessions expire after 24h; the user record is re-checked in auth.ts (Node runtime). */
export const SESSION_MAX_AGE = 24 * 60 * 60;

/**
 * Edge-safe config shared with middleware. No database access here: middleware
 * runs on the Edge runtime. The periodic DB re-check of the user lives in the
 * jwt callback of auth.ts, which only runs on the Node runtime (route handlers,
 * server components), and requireAdmin() goes through it.
 */
export const authConfig = {
  pages: {
    signIn: '/rk-studio/auth',
  },
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === 'admin';
      const ok = isLoggedIn && isAdmin;

      // API admin routes: return JSON 401 instead of redirecting
      if (nextUrl.pathname.startsWith('/api/admin')) {
        if (ok) return true;
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (nextUrl.pathname.startsWith('/rk-studio') && !nextUrl.pathname.startsWith('/rk-studio/auth')) {
        return ok;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.role) session.user.role = token.role as UserRole;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.checkedAt = Date.now();
      }
      return token;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
