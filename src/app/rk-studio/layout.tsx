import type { Metadata } from 'next';

// Shared by the login page and the studio. The session guard lives in
// (studio)/layout.tsx so the login page itself is never behind it — guarding
// /rk-studio/auth redirected it to itself in an endless loop.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function RkStudioRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
