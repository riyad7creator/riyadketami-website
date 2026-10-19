import NextAuth, { CredentialsSignin } from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { clientIp, hitLimit, peekLimit, resetLimit } from '@/lib/rate-limit';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set. The application cannot start without it.');
}

/** Failed logins allowed per email + IP before that pair is throttled */
const LOGIN_FAILURES = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
/** How often the jwt callback re-reads the user (deleted or deactivated users lose access) */
const RECHECK_MS = Number(process.env.AUTH_RECHECK_MS) > 0 ? Number(process.env.AUTH_RECHECK_MS) : 5 * 60 * 1000;

class RateLimitedSignin extends CredentialsSignin {
  code = 'rate_limited';
}

class InvalidCredentialsSignin extends CredentialsSignin {
  code = 'invalid_credentials';
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Node runtime only (middleware uses the edge-safe authConfig callbacks).
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.checkedAt = Date.now();
        return token;
      }
      const last = typeof token.checkedAt === 'number' ? token.checkedAt : 0;
      if (Date.now() - last < RECHECK_MS) return token;

      try {
        await dbConnect();
        const id = typeof token.sub === 'string' && /^[0-9a-fA-F]{24}$/.test(token.sub) ? token.sub : null;
        const fresh = id ? await User.findById(id).select('role isActive').lean() : null;
        // Deleted or deactivated: invalidate the session
        if (!fresh || !fresh.isActive) return null;
        token.role = fresh.role;
        token.checkedAt = Date.now();
      } catch (error) {
        // DB unreachable: keep the token and retry on the next request
        console.error('[auth] user re-check failed:', error);
      }
      return token;
    },
  },
  providers: [
    Credentials({
      async authorize(credentials, request) {
        const rawEmail = credentials?.email;
        const password = credentials?.password;
        if (typeof rawEmail !== 'string' || typeof password !== 'string') return null;
        const email = rawEmail.trim().toLowerCase();
        if (!email || !password || email.length > 100 || password.length > 200) return null;

        // Throttle per email + IP: failed attempts from one source never lock
        // the account for everyone else.
        const throttleKey = `${email}|${request ? clientIp(request) : 'local'}`;
        if (await peekLimit(throttleKey, LOGIN_FAILURES, 'login-fail')) {
          throw new RateLimitedSignin();
        }

        const fail = async (): Promise<null> => {
          await hitLimit(throttleKey, LOGIN_FAILURES, LOGIN_WINDOW_MS, 'login-fail');
          throw new InvalidCredentialsSignin();
        };

        try {
          await dbConnect();
          const user = await User.findOne({ email }).select('+password');
          if (!user || !user.isActive || !user.password) return await fail();

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (!passwordsMatch) {
            await user.incLoginAttempts();
            return await fail();
          }

          await resetLimit(throttleKey, 'login-fail');
          await user.updateOne({
            $set: { loginAttempts: 0, lastLoginAt: new Date() },
            $unset: { lockUntil: 1 },
          });

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error;
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
});
