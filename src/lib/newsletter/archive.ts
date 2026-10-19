import dbConnect from '@/lib/db/connect';
import Campaign from '@/models/Campaign';
import type { NlLang } from './config';

export interface ArchiveItem {
  slug: string;
  subject: string;
  previewText?: string;
  sentAt: string;
  lang: NlLang;
}

const PUBLIC = { status: 'sent' as const, isPublic: true, slug: { $exists: true } };

/** Sent public issues that have an edition written in `lang` */
export async function getArchive(lang: NlLang): Promise<ArchiveItem[]> {
  try {
    await dbConnect();
    const rows = await Campaign.find({ ...PUBLIC, editions: { $elemMatch: { lang, fallback: { $ne: true }, status: 'sent' } } })
      .sort({ sentAt: -1 })
      .limit(200)
      .select('slug sentAt editions.lang editions.subject editions.previewText editions.fallback editions.status')
      .lean();
    return rows.map((c) => {
      const e = c.editions.find((x) => x.lang === lang && !x.fallback)!;
      return { slug: c.slug!, subject: e.subject, previewText: e.previewText, sentAt: new Date(c.sentAt ?? c.createdAt).toISOString(), lang };
    });
  } catch {
    return [];
  }
}

/** One issue in `lang`, else its English edition */
export async function getIssue(slug: string, lang: NlLang) {
  try {
    await dbConnect();
    const c = await Campaign.findOne({ ...PUBLIC, slug: slug.toLowerCase() }).lean();
    if (!c) return null;
    const own = c.editions.filter((e) => !e.fallback && e.status === 'sent' && e.bodyHtml);
    const e = own.find((x) => x.lang === lang) ?? own.find((x) => x.lang === 'en') ?? own[0];
    if (!e) return null;
    return {
      slug: c.slug!,
      subject: e.subject,
      previewText: e.previewText,
      bodyHtml: e.bodyHtml,
      lang: e.lang as NlLang,
      sentAt: new Date(c.sentAt ?? c.createdAt).toISOString(),
      languages: own.map((x) => x.lang as NlLang),
    };
  } catch {
    return null;
  }
}

/** All public issue slugs and their languages, for the sitemap */
export async function getArchiveIndex(): Promise<{ slug: string; sentAt: Date; languages: NlLang[] }[]> {
  try {
    await dbConnect();
    const rows = await Campaign.find(PUBLIC).select('slug sentAt createdAt editions.lang editions.fallback editions.status').lean();
    return rows.map((c) => ({
      slug: c.slug!,
      sentAt: new Date(c.sentAt ?? c.createdAt),
      languages: c.editions.filter((e) => !e.fallback && e.status === 'sent').map((e) => e.lang as NlLang),
    }));
  } catch {
    return [];
  }
}
