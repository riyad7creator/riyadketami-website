'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2 text-xs text-text-2 hover:text-danger transition-colors duration-[var(--duration-fast)] w-full"
    >
      <LogOut size={13} />
      Sign out
    </button>
  );
}
