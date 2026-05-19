import type { NextAuthConfig } from 'next-auth';
import type { UserRole } from '@/models/User';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === 'admin';
      const ok = isLoggedIn && isAdmin;

      // API admin routes: return JSON 401 instead of redirecting to /login
      if (nextUrl.pathname.startsWith('/api/admin')) {
        if (ok) return true;
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (nextUrl.pathname.startsWith('/admin')) {
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
      }
      return token;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
