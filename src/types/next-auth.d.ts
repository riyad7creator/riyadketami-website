import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'editor' | 'viewer';
    } & DefaultSession['user'];
  }
  interface User {
    role: 'admin' | 'editor' | 'viewer';
  }
}
