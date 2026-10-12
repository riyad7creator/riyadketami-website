import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/lib/dictionaries';
import { BRAND } from '@/lib/brand';
import Wordmark from './Wordmark';
import SocialRow from './SocialRow';

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

export default function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear();

  const links = [
    { label: dict.nav.about, href: `/${locale}/about` },
    { label: dict.nav.services, href: `/${locale}/services` },
    { label: dict.nav.blog, href: `/${locale}/blog` },
    { label: dict.nav.contact, href: `/${locale}/contact` },
    { label: 'Links', href: '/links' },
  ];

  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-12 sm:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="flex flex-col gap-3">
            <Link href={`/${locale}`} aria-label={`${BRAND.name}, home`} className="w-fit text-xl text-paper">
              <Wordmark />
            </Link>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-paper">{BRAND.title}</p>
            <a
              href={BRAND.abb.url}
              target="_blank"
              rel="noopener"
              className="w-fit font-mono text-xs uppercase tracking-[0.12em] text-muted hover:text-paper"
            >
              {BRAND.proofLine}
            </a>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-[44px] items-center px-2 text-sm text-muted transition-colors duration-[var(--duration-fast)] hover:text-paper"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-2">
          <a href={BRAND.mailto} className="w-fit select-text font-mono text-sm text-paper hover:text-signal">
            {BRAND.email}
          </a>
          <p className="text-sm text-muted">{dict.home.contact.location}</p>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-line pt-6 md:flex-row md:items-center">
          <SocialRow className="-ms-2" />
          <div className="flex flex-col gap-1 md:items-end">
            <p className="font-mono text-xs text-paper">{BRAND.tagline}</p>
            <p className="font-mono text-xs text-muted">
              &copy; {year} {BRAND.name}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
