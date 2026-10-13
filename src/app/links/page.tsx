import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import dbConnect from '@/lib/db/connect';
import LatestSourceModel from '@/models/LatestSource';
import SiteProfileModel from '@/models/SiteProfile';
import { getCachedFeed, youtubeRssUrl } from '@/lib/rss-fetcher';
import { getDictionary } from '@/lib/dictionaries';
import { BRAND } from '@/lib/brand';
import Eyebrow from '@/components/ui/Eyebrow';
import { QuickLinkList } from '@/components/home/QuickLinks';
import ProfileHeader from './_components/ProfileHeader';
import LatestSection from './_components/LatestSection';
import NewsletterCard from './_components/NewsletterCard';
import type { Locale } from '@/i18n/config';

export const revalidate = 3600;

// A YouTube channel ID always starts with UC and is 24 chars
const YT_CHANNEL_ID_RE = /^UC[\w-]{22}$/;

/**
 * Latest content from the admin-managed RSS sources. Non-fatal: the page must
 * render even when MongoDB is unreachable.
 *
 * The admin-managed sponsored / resource / service cards are deliberately not
 * rendered: the brief caps the link block at 5 with one PARTNER slot, and the
 * stored cards still need the expired-campaign audit (BRAND_AUDIT.md K3).
 */
async function getLatest() {
  try {
    await dbConnect();
    const sources = await LatestSourceModel.find({ active: true }).sort({ order: 1 }).lean();
    const items = await Promise.all(
      sources.map(async (source) => {
        if (source.rssUrl) {
          const feedUrl = YT_CHANNEL_ID_RE.test(source.rssUrl) ? youtubeRssUrl(source.rssUrl) : source.rssUrl;
          const first = (await getCachedFeed(feedUrl))?.[0];
          if (first) return { source, item: first };
        }
        if (source.manualUrl && source.manualTitle) {
          return {
            source,
            item: {
              title: source.manualTitle,
              link: source.manualUrl,
              publishedAt: new Date(0),
              thumbnail: source.manualThumb ?? undefined,
            },
          };
        }
        return null;
      })
    );
    return items.filter((x): x is NonNullable<typeof x> => x !== null);
  } catch {
    return [];
  }
}

/** Optional status line set in Studio → Links → Profile. Non-fatal like getLatest. */
async function getStatusLine(): Promise<string | null> {
  try {
    await dbConnect();
    const profile = await SiteProfileModel.findById('links-profile').select('statusEnabled statusLine').lean();
    return profile?.statusEnabled && profile.statusLine ? profile.statusLine : null;
  } catch {
    return null;
  }
}

export default async function LinksPage() {
  const locale: Locale = 'en';
  const dict = getDictionary(locale);
  const [latestItems, statusLine] = await Promise.all([getLatest(), getStatusLine()]);

  return (
    <main className="min-h-[100dvh] bg-ink px-4 py-12 sm:py-20">
      <div className="mx-auto flex w-full max-w-md flex-col gap-10">
        <ProfileHeader />

        {statusLine && (
          <p className="flex items-center gap-3 text-sm text-paper">
            <span aria-hidden className="h-px w-4 bg-signal" />
            {statusLine}
          </p>
        )}

        <section aria-labelledby="links" className="flex flex-col gap-3">
          <Eyebrow as="h2" id="links">
            {dict.home.quick_links.eyebrow}
          </Eyebrow>
          <QuickLinkList dict={dict} />
        </section>

        <LatestSection items={latestItems} label={dict.links_page.latest} />

        <NewsletterCard dict={dict} locale={locale} />

        <div className="flex w-full gap-3">
          <a
            href={BRAND.mailto}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-[var(--radius-md)] border border-line text-sm text-paper hover:border-paper/60"
          >
            {dict.links_page.cta_contact}
          </a>
          <Link
            href={`/${locale}`}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-signal text-sm font-medium text-ink hover:bg-signal/90"
          >
            {dict.links_page.cta_home} <ArrowUpRight size={14} aria-hidden />
          </Link>
        </div>

        <p className="font-mono text-[11px] tracking-[0.08em] text-muted">
          © {new Date().getFullYear()} {BRAND.name} · {BRAND.tagline}
        </p>
      </div>
    </main>
  );
}
