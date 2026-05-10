import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Riyad Ketami — Links',
  description: 'Newsletter, resources, consulting sessions, and social channels — all in one place.',
  openGraph: {
    title: 'Riyad Ketami',
    description: 'Digital Entrepreneur · AI Consultant · Content Creator. 400K+ community.',
    type: 'website',
  },
};

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
