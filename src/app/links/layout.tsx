import type { Metadata } from 'next';
import { BRAND } from '@/lib/brand';

const description = `${BRAND.title} · ${BRAND.proofLine}. ${BRAND.abb.name}, Telegram, YouTube and every channel in one place.`;

export const metadata: Metadata = {
  title: 'Links', // root template appends " | Riyad Ketami"
  description,
  alternates: { canonical: '/links' },
  openGraph: {
    type: 'profile',
    title: `${BRAND.name} · Links`,
    description,
    url: `${BRAND.url}/links`,
    images: [{ url: BRAND.images.og, width: 1200, height: 630, alt: `${BRAND.name}, ${BRAND.title}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} · Links`,
    description,
    images: [BRAND.images.og],
  },
};

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
