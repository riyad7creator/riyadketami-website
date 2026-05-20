import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import MatrixRain from '@/components/ui/MatrixRain';
import dbConnect from '@/lib/db/connect';
import LinkCardModel from '@/models/LinkCard';
import LatestSourceModel from '@/models/LatestSource';
import SiteProfileModel from '@/models/SiteProfile';
import { getSetting } from '@/models/SiteSettings';
import { getCachedFeed, youtubeRssUrl } from '@/lib/rss-fetcher';
import ProfileHeader from './_components/ProfileHeader';
import SponsoredSection from './_components/SponsoredSection';
import LatestSection from './_components/LatestSection';
import ResourcesSection from './_components/ResourcesSection';
import NewsletterCard from './_components/NewsletterCard';
import ServicesSection from './_components/ServicesSection';
import type { CardProps } from './_components/Card';
import type { ILinkCard } from '@/models/LinkCard';

export const revalidate = 3600;

// A YouTube channel ID always starts with UC and is 24 chars
const YT_CHANNEL_ID_RE = /^UC[\w-]{22}$/;

function toCardProps(c: ILinkCard & { _id: unknown }): CardProps {
  return {
    _id: String(c._id),
    title: c.title,
    description: c.description,
    href: c.href,
    icon: c.icon,
    thumbnail: c.thumbnail,
    pillLabel: c.pillLabel,
    pillVariant: c.pillVariant,
    pillColor: c.pillColor,
  };
}

const DEFAULT_PROFILE = {
  name: 'Riyad Ketami',
  tagline: 'Digital Entrepreneur · AI Consultant · Creator',
  statusLine: undefined as string | undefined,
  statusEnabled: false,
  subscriberCount: 5000,
  socials: {
    tiktok: { url: 'https://tiktok.com/@riyadketami', count: '200K+' },
    youtube: { url: 'https://youtube.com/@riyadketami', count: '50K+' },
    instagram: { url: 'https://instagram.com/riyadketami', count: '80K+' },
  },
};

export default async function LinksPage() {
  await dbConnect();

  const [profileDoc, cardsRaw, sourcesRaw, profileImage] = await Promise.all([
    SiteProfileModel.findById('links-profile').lean(),
    LinkCardModel.find({ active: true }).sort({ section: 1, order: 1 }).lean(),
    LatestSourceModel.find({ active: true }).sort({ order: 1 }).lean(),
    getSetting<string>('profile_image'),
  ]);

  const profile = profileDoc ?? DEFAULT_PROFILE;
  const now = new Date();

  // Filter cards by their active date window
  const liveCards = cardsRaw.filter((c) => {
    if (c.startsAt && now < new Date(c.startsAt)) return false;
    if (c.endsAt && now > new Date(c.endsAt)) return false;
    return true;
  });

  const sponsored = liveCards.filter((c) => c.section === 'sponsored').slice(0, 2);
  const fallback = liveCards.filter((c) => c.section === 'fallback').slice(0, 1);
  const resources = liveCards.filter((c) => c.section === 'resource');
  const services = liveCards.filter((c) => c.section === 'service');

  // If no live sponsored cards, show the fallback card instead
  const sponsoredToShow = sponsored.length > 0 ? sponsored : fallback;

  // Fetch RSS / use manual overrides for each active latest source
  const latestItems = (
    await Promise.all(
      sourcesRaw.map(async (source) => {
        if (source.rssUrl) {
          // Support storing a bare YouTube channel ID in rssUrl
          const feedUrl = YT_CHANNEL_ID_RE.test(source.rssUrl)
            ? youtubeRssUrl(source.rssUrl)
            : source.rssUrl;
          const items = await getCachedFeed(feedUrl);
          const first = items?.[0];
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
    )
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  const imgSrc = profileImage ?? '/portraits/portrait-hero.png';

  return (
    <main className="relative min-h-[100dvh] flex flex-col items-center justify-start bg-bg-0 overflow-hidden px-5 py-12 sm:py-20">
      {/* Matrix rain background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <MatrixRain opacity={0.04} speed={0.6} density={0.7} />
      </div>

      {/* Ambient top glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[480px] h-[240px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center top, rgba(0,255,102,0.07) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      {/* Avatar pulse-ring animation */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.3; transform: scale(1.18); }
          50%       { opacity: 0.8; transform: scale(1.22); }
        }
      `}</style>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        <ProfileHeader
          name={profile.name}
          tagline={profile.tagline}
          statusLine={profile.statusLine}
          statusEnabled={profile.statusEnabled}
          subscriberCount={profile.subscriberCount}
          socials={profile.socials ?? {}}
          profileImage={imgSrc}
        />

        <SponsoredSection
          cards={sponsoredToShow.map(toCardProps)}
          isFallback={sponsored.length === 0}
        />

        <LatestSection items={latestItems} />

        <ResourcesSection cards={resources.map(toCardProps)} />

        <NewsletterCard subscriberCount={profile.subscriberCount} />

        <ServicesSection cards={services.map(toCardProps)} />

        {/* Footer CTAs */}
        <div className="flex gap-3 w-full">
          <Link
            href="/en/contact"
            className="flex-1 glass rounded-[var(--radius-md)] py-3 text-center text-sm font-medium text-text-1 hover:border-matrix/40 hover:text-text-0 transition-all duration-[var(--duration-fast)]"
          >
            Get in touch
          </Link>
          <Link
            href="/en"
            className="flex-1 flex items-center justify-center gap-1.5 bg-matrix text-bg-0 rounded-[var(--radius-md)] py-3 text-sm font-semibold hover:bg-matrix/90 transition-colors"
          >
            Visit website <ArrowUpRight size={13} />
          </Link>
        </div>

        <p className="font-mono text-[9px] text-text-2 tracking-[0.12em] pb-4">
          © {new Date().getFullYear()} Riyad Ketami
        </p>
      </div>
    </main>
  );
}
