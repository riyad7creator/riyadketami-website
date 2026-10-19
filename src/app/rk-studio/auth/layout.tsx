import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Studio login',
};

export default function StudioAuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
