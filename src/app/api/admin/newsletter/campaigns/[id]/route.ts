import { NextResponse } from 'next/server';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import dbConnect from '@/lib/db/connect';
import Campaign from '@/models/Campaign';
import CampaignEvent from '@/models/CampaignEvent';
import { requireAdmin, serverError, readJson, generateSlug } from '@/lib/api-helpers';
import { audienceByLang } from '@/lib/newsletter/campaigns';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const editionSchema = z.object({
  lang: z.enum(['en', 'fr', 'ar']),
  subject: z.string().max(200).default(''),
  previewText: z.string().max(200).optional(),
  bodyHtml: z.string().max(200_000).default(''),
});

const patchSchema = z.object({
  editions: z.array(editionSchema).max(3).optional(),
  fallbackToEnglish: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  slug: z.string().max(120).optional(),
});

/** Email-safe HTML: inline styles allowed, scripts and handlers stripped */
function clean(html: string): string {
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'style', 'align', 'width', 'height', 'bgcolor'], FORBID_TAGS: ['script', 'iframe', 'form', 'input'] });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await params;
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    await dbConnect();
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const [audience, topLinks] = await Promise.all([
      audienceByLang(),
      CampaignEvent.aggregate<{ _id: string; clicks: number; people: number }>([
        { $match: { campaignId: id, type: 'click', url: { $exists: true } } },
        { $group: { _id: '$url', clicks: { $sum: 1 }, people: { $addToSet: '$emailHash' } } },
        { $project: { clicks: 1, people: { $size: '$people' } } },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),
    ]);
    return NextResponse.json({ campaign, audience, topLinks });
  } catch (error) {
    return serverError('Failed to load campaign', error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await params;
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const parsed = patchSchema.safeParse(await readJson(req));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid campaign data' }, { status: 400 });
    const p = parsed.data;
    await dbConnect();
    const campaign = await Campaign.findById(id);
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only the archive switch can change after sending
    const editable = campaign.status === 'draft' || campaign.status === 'failed';
    if (!editable && (p.editions || p.fallbackToEnglish !== undefined)) {
      return NextResponse.json({ error: 'Sent or scheduled campaigns cannot be edited.' }, { status: 409 });
    }

    if (p.editions) {
      const seen = new Set<string>();
      const editions = p.editions
        .filter((e) => (seen.has(e.lang) ? false : (seen.add(e.lang), true)))
        .map((e) => {
          const prev = campaign.editions.find((x) => x.lang === e.lang && !x.fallback);
          return {
            lang: e.lang,
            subject: e.subject.trim(),
            previewText: e.previewText?.trim() || undefined,
            bodyHtml: clean(e.bodyHtml),
            // keep the send result of an edition that already went out (failed campaign retry)
            ...(prev?.status === 'sent' ? { status: prev.status, resendBroadcastId: prev.resendBroadcastId, recipientCount: prev.recipientCount } : {}),
          };
        });
      const keptFallbacks = campaign.editions.filter((x) => x.fallback && x.status === 'sent');
      campaign.set('editions', [...editions, ...keptFallbacks]);
      const main = editions.find((e) => e.lang === 'en' && e.subject) ?? editions.find((e) => e.subject);
      if (main) {
        campaign.subject = main.subject;
        campaign.previewText = main.previewText;
      }
    }
    if (p.fallbackToEnglish !== undefined) campaign.fallbackToEnglish = p.fallbackToEnglish;
    if (p.isPublic !== undefined) campaign.isPublic = p.isPublic;
    if (p.slug !== undefined) {
      const slug = generateSlug(p.slug).slice(0, 120);
      if (slug && (await Campaign.exists({ slug, _id: { $ne: id } }))) {
        return NextResponse.json({ error: 'That web address is already used by another issue.' }, { status: 409 });
      }
      campaign.slug = slug || undefined;
    }
    await campaign.save();
    return NextResponse.json({ ok: true, campaign: campaign.toObject() });
  } catch (error) {
    return serverError('Failed to save campaign', error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await params;
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    await dbConnect();
    const res = await Campaign.deleteOne({ _id: id, status: 'draft' });
    if (res.deletedCount === 0) return NextResponse.json({ error: 'Only drafts can be deleted.' }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Failed to delete campaign', error);
  }
}
