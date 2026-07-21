import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Riyad Ketami | Links',
  description:
    'Newsletter, free resources, consulting sessions, latest content, and social channels — all in one place.',
  openGraph: {
    type: 'website',
    title: 'Riyad Ketami | Links',
    description: 'Digital Entrepreneur · AI Consultant · Creator. 400K+ community.',
    url: `${SITE_URL}/links`,
    images: [
      {
        url: `${SITE_URL}/portraits/portrait-hero.webp`,
        width: 1600,
        height: 2814,
        alt: 'Riyad Ketami',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Riyad Ketami | Links',
    description: 'Newsletter, resources, consulting, and social channels.',
    images: [`${SITE_URL}/portraits/portrait-hero.webp`],
  },
};

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
