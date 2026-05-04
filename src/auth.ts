import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db/connect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
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

          if (passwordsMatch) {
            if (user.loginAttempts > 0) {
              await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
            }
            await user.updateOne({ $set: { lastLoginAt: new Date() } });
            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
            };
          } else {
            await user.incLoginAttempts();
            return null;
          }
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
});
