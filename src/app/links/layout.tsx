import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Riyad Ketami | Links',
  description:
    'Newsletter, free resources, consulting sessions, latest content, and social channels — all in one place.',
  openGraph: {
    type: 'website',
    title: 'Riyad Ketami | Links',
    description: 'Digital Entrepreneur · AI Consultant · Creator. 400K+ community.',
    url: 'https://riyadketami.com/links',
    images: [
      {
        url: 'https://riyadketami.com/portraits/portrait-hero.png',
        width: 800,
        height: 800,
        alt: 'Riyad Ketami',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Riyad Ketami | Links',
    description: 'Newsletter, resources, consulting, and social channels.',
    images: ['https://riyadketami.com/portraits/portrait-hero.png'],
  },
};

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
