import Link from 'next/link';
import type { Locale } from '@/i18n/config';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterProps {
  locale: Locale;
  links?: FooterLink[];
}

const SOCIAL_LINKS = [
  { label: 'TikTok', abbr: 'TK', href: 'https://tiktok.com/@riyadketami' },
  { label: 'Instagram', abbr: 'IG', href: 'https://instagram.com/riyadketami' },
  { label: 'YouTube', abbr: 'YT', href: 'https://youtube.com/@riyadketami' },
  { label: 'LinkedIn', abbr: 'LI', href: 'https://linkedin.com/in/riyadketami' },
  { label: 'X', abbr: 'X', href: 'https://x.com/riyadketami' },
];

export default function Footer({ locale, links = [] }: FooterProps) {
  const year = new Date().getFullYear();

  const defaultLinks: FooterLink[] = [
    { label: locale === 'fr' ? 'À propos' : locale === 'ar' ? 'عني' : 'About', href: `/${locale}/about` },
    { label: locale === 'fr' ? 'Blog' : locale === 'ar' ? 'المدونة' : 'Blog', href: `/${locale}/blog` },
    { label: locale === 'fr' ? 'Consulting' : locale === 'ar' ? 'استشارات' : 'Consulting', href: `/${locale}/consulting` },
    { label: locale === 'fr' ? 'Contact' : locale === 'ar' ? 'تواصل' : 'Contact', href: `/${locale}/contact` },
  ];

  const allLinks = links.length > 0 ? links : defaultLinks;

  return (
    <footer className="border-t border-border mt-32">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col gap-8">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <Link href={`/${locale}`} className="font-display font-bold text-lg text-text-0 tracking-tight">
            RK<span className="text-matrix">.</span>
          </Link>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {allLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-sm text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.abbr}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="font-mono text-[10px] tracking-[0.18em] text-text-2 hover:text-matrix transition-colors duration-[var(--duration-fast)]"
              >
                {s.abbr}
              </a>
            ))}
          </div>
          <p className="text-xs text-text-2 font-mono">
            &copy; {year} Riyad Ketami
          </p>
        </div>
      </div>
    </footer>
  );
}
