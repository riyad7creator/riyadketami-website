/**
 * Campaign sending: one Resend Broadcast per language segment.
 */
import dbConnect from '@/lib/db/connect';
import Campaign, { type ICampaignEdition, type CampaignLang } from '@/models/Campaign';
import Subscriber, { ACTIVE_FILTER } from '@/models/Subscriber';
import { generateSlug } from '@/lib/api-helpers';
import { notifyAdmin } from '@/lib/notify';
import { renderEmail, htmlToText } from './template';
import { copyFor } from './copy';
import { APP_URL, NL_LANGS, getNewsletterSettings, type NlLang, type NewsletterSettings } from './config';
import { espReady, getSegmentIds, sendBroadcast, syncSubscriber, RESEND_UNSUBSCRIBE_PLACEHOLDER } from './esp';
import { getResend } from '@/lib/resend';

export class CampaignError extends Error {
  constructor(message: string, public status = 400, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

export function hasContent(e?: Pick<ICampaignEdition, 'subject' | 'bodyHtml'> | null): boolean {
  return Boolean(e && e.subject?.trim() && e.bodyHtml?.replace(/<[^>]+>/g, '').trim());
}

/** The edition a language segment receives: its own, else English when fallback is on */
export function editionFor(
  editions: ICampaignEdition[],
  lang: NlLang,
  fallbackToEnglish: boolean
): { edition: ICampaignEdition; fallback: boolean } | null {
  const own = editions.find((e) => e.lang === lang && !e.fallback);
  if (hasContent(own)) return { edition: own!, fallback: false };
  if (lang !== 'en' && fallbackToEnglish) {
    const en = editions.find((e) => e.lang === 'en' && !e.fallback);
    if (hasContent(en)) return { edition: en!, fallback: true };
  }
  return null;
}

/** Broadcast HTML: Resend fills the unsubscribe link per contact */
export function broadcastHtml(e: Pick<ICampaignEdition, 'subject' | 'previewText' | 'bodyHtml'>, lang: NlLang, settings: NewsletterSettings): string {
  const c = copyFor(lang);
  return renderEmail({
    lang,
    subject: e.subject,
    preheader: e.previewText,
    bodyHtml: e.bodyHtml,
    footer: {
      reason: c.footer.reason,
      unsubscribeLabel: c.footer.unsubscribe,
      unsubscribeUrl: RESEND_UNSUBSCRIBE_PLACEHOLDER,
      manageLabel: c.footer.manage,
      manageUrl: `${APP_URL}/${lang}/newsletter/preferences`,
      postalAddress: settings.postalAddress || undefined,
    },
    siteUrl: `${APP_URL}/${lang}`,
  });
}

/** Active subscribers per language segment (no language counts as English) */
export async function audienceByLang(): Promise<Record<NlLang, number>> {
  await dbConnect();
  const rows = await Subscriber.aggregate<{ _id: string | null; n: number }>([
    { $match: ACTIVE_FILTER },
    { $group: { _id: '$preferredLanguage', n: { $sum: 1 } } },
  ]);
  const out: Record<NlLang, number> = { en: 0, fr: 0, ar: 0 };
  for (const r of rows) {
    const l = (r._id === 'fr' || r._id === 'ar' ? r._id : 'en') as NlLang;
    out[l] += r.n;
  }
  return out;
}

/** Mirror unsynced subscribers to Resend until the time budget runs out */
export async function syncPending(budgetMs: number): Promise<{ synced: number; failed: number; remaining: number }> {
  await dbConnect();
  const started = Date.now();
  let synced = 0;
  let failed = 0;
  const needsSync = { confirmed: { $ne: false }, resendSyncedAt: { $exists: false } };
  const seen = new Set<string>();
  while (Date.now() - started < budgetMs) {
    const batch = await Subscriber.find(needsSync).select('email').limit(25).lean();
    const fresh = batch.filter((b) => !seen.has(b.email));
    if (fresh.length === 0) break;
    for (const { email } of fresh) {
      if (Date.now() - started >= budgetMs) break;
      seen.add(email);
      if (await syncSubscriber(email)) synced++;
      else failed++;
    }
  }
  const remaining = await Subscriber.countDocuments(needsSync);
  return { synced, failed, remaining };
}

async function uniqueSlug(subject: string, id: string): Promise<string> {
  const base = (generateSlug(subject) || 'issue').slice(0, 80);
  const taken = await Campaign.exists({ slug: base, _id: { $ne: id } });
  return taken ? `${base}-${id.slice(-6)}` : base;
}

/**
 * Send (or schedule) a campaign: one broadcast per language segment that has
 * subscribers and an edition. Editions already sent are never sent again, so a
 * failed campaign can be retried safely.
 */
export async function sendCampaign(id: string, opts: { scheduledAt?: Date } = {}) {
  if (!espReady()) throw new CampaignError('RESEND_API_KEY is not configured', 500);
  await dbConnect();
  const settings = await getNewsletterSettings();
  if (!settings.postalAddress.trim()) {
    throw new CampaignError('Add a postal address in Newsletter settings first: every newsletter footer must show one.');
  }
  if (opts.scheduledAt && (opts.scheduledAt.getTime() < Date.now() + 60_000 || opts.scheduledAt.getTime() > Date.now() + 30 * 24 * 3600_000)) {
    throw new CampaignError('Pick a time between 1 minute and 30 days from now.');
  }

  // Claim the campaign: only one send can run
  const campaign = await Campaign.findOneAndUpdate(
    { _id: id, status: { $in: ['draft', 'failed'] } },
    { $set: { status: 'sending' } },
    { new: true }
  );
  if (!campaign) throw new CampaignError('This campaign is already sending or sent.', 409);

  try {
    // Contacts must exist in Resend before a broadcast can reach them
    const sync = await syncPending(150_000);
    if (sync.remaining > 0) {
      throw new CampaignError(
        `${sync.remaining} subscribers are not synced to Resend yet. Press Send again to continue syncing.`,
        409,
        { remaining: sync.remaining }
      );
    }

    const segments = await getSegmentIds();
    const audience = await audienceByLang();
    const editions: ICampaignEdition[] = campaign.editions.filter((e) => !e.fallback).map((e) => ({ ...JSON.parse(JSON.stringify(e)) }));
    const previous = campaign.editions;
    let sentAny = false;
    let failedAny = false;
    let recipients = 0;

    for (const lang of NL_LANGS) {
      const already = previous.find((e) => e.lang === lang && e.status === 'sent');
      if (already) {
        sentAny = true;
        recipients += already.recipientCount ?? 0;
        if (already.fallback) editions.push(JSON.parse(JSON.stringify(already)));
        continue;
      }
      const pick = editionFor(editions, lang, campaign.fallbackToEnglish !== false);
      const own = editions.find((e) => e.lang === lang);
      if (!pick || audience[lang] === 0) {
        if (own) own.status = 'skipped';
        continue;
      }
      let target = own && !pick.fallback ? own : null;
      if (!target) {
        target = { lang: lang as CampaignLang, subject: pick.edition.subject, previewText: pick.edition.previewText, bodyHtml: pick.edition.bodyHtml, fallback: true };
        editions.push(target);
      }
      try {
        // An English fallback keeps the English layout (left to right, English footer)
        const html = broadcastHtml(pick.edition, pick.fallback ? 'en' : lang, settings);
        target.resendBroadcastId = await sendBroadcast({
          segmentId: segments[lang],
          name: `${campaign.subject} [${lang.toUpperCase()}]`,
          subject: pick.edition.subject,
          previewText: pick.edition.previewText,
          html,
          text: htmlToText(html),
          replyTo: settings.replyTo,
          scheduledAt: opts.scheduledAt,
        });
        target.status = 'sent';
        target.recipientCount = audience[lang];
        target.error = undefined;
        recipients += audience[lang];
        sentAny = true;
      } catch (err) {
        target.status = 'failed';
        target.error = (err instanceof Error ? err.message : 'Send failed').slice(0, 480);
        failedAny = true;
      }
    }

    if (!sentAny && !failedAny) throw new CampaignError('Nothing to send: no edition has a subject and body for a language with subscribers.');

    const status = failedAny ? 'failed' : opts.scheduledAt ? 'scheduled' : 'sent';
    const slug = campaign.slug || (await uniqueSlug(campaign.subject, String(campaign._id)));
    await Campaign.updateOne(
      { _id: campaign._id },
      {
        $set: {
          editions,
          status,
          slug,
          recipientCount: recipients,
          ...(sentAny ? { sentAt: opts.scheduledAt ?? new Date() } : {}),
          ...(opts.scheduledAt ? { scheduledAt: opts.scheduledAt } : {}),
          failedCount: editions.filter((e) => e.status === 'failed').length,
        },
      }
    );
    if (failedAny) {
      void notifyAdmin({
        type: 'send_failure',
        title: 'Newsletter send had failures',
        body: `"${campaign.subject}": ${editions.filter((e) => e.status === 'failed').map((e) => `${e.lang.toUpperCase()}: ${e.error}`).join(' | ')}`.slice(0, 1400),
        link: `/rk-studio/newsletter/campaigns/${String(campaign._id)}`,
      });
    }
    return { status, recipients, editions: editions.map((e) => ({ lang: e.lang, status: e.status, error: e.error, recipientCount: e.recipientCount, fallback: e.fallback })) };
  } catch (err) {
    // Hand the campaign back so it can be fixed and sent again
    const cur = await Campaign.findById(campaign._id).select('status editions').lean();
    if (cur?.status === 'sending') {
      const anySent = cur.editions.some((e) => e.status === 'sent');
      await Campaign.updateOne({ _id: campaign._id }, { $set: { status: anySent ? 'failed' : 'draft' } });
    }
    throw err;
  }
}

/** Cancel a scheduled campaign: delete its broadcasts in Resend, back to draft */
export async function cancelScheduled(id: string) {
  await dbConnect();
  const campaign = await Campaign.findOne({ _id: id, status: 'scheduled' });
  if (!campaign) throw new CampaignError('Only a scheduled campaign can be cancelled.', 409);
  if (campaign.scheduledAt && campaign.scheduledAt.getTime() < Date.now() + 30_000) {
    throw new CampaignError('Too late to cancel: it is going out now.', 409);
  }
  const resend = getResend();
  if (!resend) throw new CampaignError('RESEND_API_KEY is not configured', 500);
  const errors: string[] = [];
  for (const e of campaign.editions) {
    if (!e.resendBroadcastId) continue;
    const res = await resend.broadcasts.remove(e.resendBroadcastId);
    if (res.error) errors.push(`${e.lang}: ${res.error.message}`);
  }
  if (errors.length) throw new CampaignError(`Could not cancel every broadcast: ${errors.join('; ')}`, 502);
  await Campaign.updateOne(
    { _id: id },
    {
      $set: {
        status: 'draft',
        editions: campaign.editions.filter((e) => !e.fallback).map((e) => ({ lang: e.lang, subject: e.subject, previewText: e.previewText, bodyHtml: e.bodyHtml })),
        recipientCount: 0,
      },
      $unset: { scheduledAt: '', sentAt: '' },
    }
  );
}
