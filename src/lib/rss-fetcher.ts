import { XMLParser } from 'fast-xml-parser';
import { unstable_cache } from 'next/cache';

export interface RssItem {
  title: string;
  link: string;
  publishedAt: Date;
  thumbnail?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'entry'].includes(name),
});

const FETCH_TIMEOUT_MS = 5_000;
const USER_AGENT = 'RiyadKetami-Site/1.0 (+https://ketami.net)';

async function fetchRssFeed(url: string): Promise<RssItem[] | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 3600, tags: ['rss', `rss:${url}`] },
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.error(`[rss-fetcher] HTTP ${res.status} for ${url}`);
      return null;
    }

    const xml = await res.text();
    const parsed = parser.parse(xml) as Record<string, unknown>;

    // Atom feed (YouTube uses Atom)
    const feed = parsed['feed'] as Record<string, unknown> | undefined;
    if (feed) {
      const entries = (feed['entry'] as Record<string, unknown>[] | undefined) ?? [];
      return entries.slice(0, 10).map((e) => {
        const mediaGroup = e['media:group'] as Record<string, unknown> | undefined;
        const mediaThumbnail =
          (mediaGroup?.['media:thumbnail'] as Record<string, string> | undefined) ??
          (e['media:thumbnail'] as Record<string, string> | undefined);
        const thumbnail = mediaThumbnail?.['@_url'];
        return {
          title: String((e['title'] as Record<string, unknown>)?.['#text'] ?? e['title'] ?? ''),
          link: String((e['link'] as Record<string, string> | undefined)?.['@_href'] ?? e['link'] ?? ''),
          publishedAt: new Date(String(e['published'] ?? e['updated'] ?? Date.now())),
          thumbnail: thumbnail ? String(thumbnail) : undefined,
        };
      });
    }

    // RSS 2.0 feed
    const channel = (parsed['rss'] as Record<string, unknown> | undefined)?.['channel'] as
      | Record<string, unknown>
      | undefined;
    if (channel) {
      const items = (channel['item'] as Record<string, unknown>[] | undefined) ?? [];
      return items.slice(0, 10).map((item) => {
        const enclosure = item['enclosure'] as Record<string, string> | undefined;
        const mediaThumbnail = item['media:thumbnail'] as Record<string, string> | undefined;
        const thumbnail = mediaThumbnail?.['@_url'] ?? enclosure?.['@_url'];
        return {
          title: String(item['title'] ?? ''),
          link: String(item['link'] ?? item['guid'] ?? ''),
          publishedAt: new Date(String(item['pubDate'] ?? Date.now())),
          thumbnail: thumbnail ? String(thumbnail) : undefined,
        };
      });
    }

    console.warn(`[rss-fetcher] Unrecognised feed format for ${url}`);
    return null;
  } catch (err) {
    console.error(`[rss-fetcher] Failed to fetch ${url}:`, err);
    return null;
  }
}

/** Cached version — 1 hour TTL, keyed by URL */
export const getCachedFeed = unstable_cache(
  fetchRssFeed,
  ['rss-feed'],
  { revalidate: 3600, tags: ['rss'] }
);

/** Build the YouTube Atom RSS URL from a channel ID */
export function youtubeRssUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

/** Relative time label, e.g. "2 days ago" */
export function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Returns true if the date is within the last 7 days */
export function isNew(date: Date): boolean {
  return Date.now() - date.getTime() < 7 * 86_400_000;
}
