import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set. The application cannot start without it.');
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials, request) {
        // Rate-limit login attempts per IP — 5 per minute
        if (request) {
          const limited = await rateLimit(request, 5, 60_000, 'login');
          if (limited) throw new Error('Too many login attempts. Please try again in a minute.');
        }

        if (!credentials?.email || !credentials?.password) return null;

        try {
          await dbConnect();
          const user = await User.findOne({ email: credentials.email }).select('+password');

          if (!user || !user.isActive) return null;

          if (user.isLocked()) {
            throw new Error('Account temporarily locked. Try again later.');
          }

          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.password as string
          );

          if (!passwordsMatch) {
            await user.incLoginAttempts();
            return null;
          }

          if (user.loginAttempts > 0) {
            await user.updateOne({
              $set: { loginAttempts: 0, lastLoginAt: new Date() },
              $unset: { lockUntil: 1 },
            });
          } else {
            await user.updateOne({ $set: { lastLoginAt: new Date() } });
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
});
