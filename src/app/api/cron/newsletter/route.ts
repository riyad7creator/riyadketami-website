import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import dbConnect from '@/lib/db/connect';
import Subscriber, { ACTIVE_FILTER } from '@/models/Subscriber';
import Campaign, { type ICampaignEdition } from '@/models/Campaign';
import CampaignEvent from '@/models/CampaignEvent';
import Post from '@/models/Post';
import { notifyAdmin } from '@/lib/notify';
import { sendWelcomeEmail, sendWinbackEmail, langOf } from '@/lib/newsletter/mail';
import { unsubscribeSubscriber } from '@/lib/newsletter/lifecycle';
import { copyFor } from '@/lib/newsletter/copy';
import { escHtml } from '@/lib/newsletter/template';
import { APP_URL, NL_LANGS } from '@/lib/newsletter/config';

export const maxDuration = 300;

const DAY = 24 * 3600 * 1000;
/** Transactional emails this job may send per run (Resend Free allows 100 a day in total) */
const EMAIL_CAP = Math.max(0, Number(process.env.NEWSLETTER_DAILY_EMAIL_CAP ?? 80) || 80);

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get('authorization') ?? '');
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

/**
 * GET /api/cron/newsletter: daily job (vercel.json, 09:00 UTC).
 * 1. Welcome series emails 2 and 3 (and retries of email 1)
 * 2. Scheduled campaigns whose time has passed are marked sent
 * 3. Unconfirmed signups older than 14 days are removed
 * 4. Sunset: one win-back email after 180 days without a click, then removal
 * 5. Weekly digest: a draft campaign from the week's new blog posts
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 503 });
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const now = Date.now();
  let budget = EMAIL_CAP;
  const report: Record<string, unknown> = {};

  // 1. Welcome series
  let welcomeSent = 0;
  let welcomeFailed = 0;
  const due = await Subscriber.find({ ...ACTIVE_FILTER, welcomeStep: { $in: [0, 1, 2] }, welcomeNextAt: { $lte: new Date(now) } })
    .select('email preferredLanguage welcomeStep')
    .limit(budget)
    .lean();
  for (const s of due) {
    if (budget <= 0) break;
    const step = ((s.welcomeStep ?? 0) + 1) as 1 | 2 | 3;
    const res = await sendWelcomeEmail(s.email, langOf(s.preferredLanguage), step);
    budget--;
    if (res.ok) {
      welcomeSent++;
      await Subscriber.updateOne(
        { _id: s._id },
        step < 3
          ? { $set: { welcomeStep: step, welcomeNextAt: new Date(now + (step === 1 ? 3 : 4) * DAY) } }
          : { $set: { welcomeStep: 3 }, $unset: { welcomeNextAt: '' } }
      );
    } else {
      welcomeFailed++;
    }
  }
  report.welcome = { sent: welcomeSent, failed: welcomeFailed };

  // 2. Scheduled campaigns that went out
  const delivered = await Campaign.updateMany({ status: 'scheduled', scheduledAt: { $lte: new Date(now) } }, { $set: { status: 'sent' } });
  report.scheduledMarkedSent = delivered.modifiedCount;

  // 3. Unconfirmed signups: forget them after 14 days (they never consented)
  const stale = new Date(now - 14 * DAY);
  const purged = await Subscriber.deleteMany({ confirmed: false, confirmedAt: { $exists: false }, confirmSentAt: { $lt: stale } });
  // People who had confirmed before and re-signed up keep their old state
  await Subscriber.updateMany({ confirmed: false, confirmedAt: { $exists: true }, confirmSentAt: { $lt: stale } }, { $set: { confirmed: true } });
  report.unconfirmedRemoved = purged.deletedCount;

  // 4. Sunset, only when click data is trustworthy (webhooks on, clicks recorded, regular sends)
  const halfYear = new Date(now - 180 * DAY);
  const [recentCampaigns, anyClick] = await Promise.all([
    Campaign.countDocuments({ status: 'sent', sentAt: { $gte: halfYear } }),
    CampaignEvent.exists({ type: 'click', createdAt: { $gte: halfYear } }),
  ]);
  if (process.env.RESEND_WEBHOOK_SECRET && recentCampaigns >= 3 && anyClick) {
    const inactive = { $or: [{ lastClickAt: { $exists: false } }, { lastClickAt: { $lt: halfYear } }] };
    const old = { $or: [{ confirmedAt: { $lt: halfYear } }, { confirmedAt: { $exists: false }, createdAt: { $lt: halfYear } }] };
    const winbackTargets = await Subscriber.find({ $and: [ACTIVE_FILTER, inactive, old, { winbackSentAt: { $exists: false } }] })
      .select('email preferredLanguage')
      .limit(Math.min(budget, 40))
      .lean();
    let winbacks = 0;
    for (const s of winbackTargets) {
      const res = await sendWinbackEmail(s.email, langOf(s.preferredLanguage));
      budget--;
      if (res.ok) {
        winbacks++;
        await Subscriber.updateOne({ _id: s._id }, { $set: { winbackSentAt: new Date() } });
      }
    }
    const expired = await Subscriber.find({
      ...ACTIVE_FILTER,
      winbackSentAt: { $lt: new Date(now - 14 * DAY) },
    }).select('email winbackSentAt lastClickAt').limit(200).lean();
    let sunset = 0;
    for (const s of expired) {
      if (s.lastClickAt && s.winbackSentAt && s.lastClickAt > s.winbackSentAt) continue;
      if (await unsubscribeSubscriber(s.email, 'inactive')) sunset++;
    }
    report.sunset = { winbacks, removed: sunset };
  } else {
    report.sunset = 'skipped (needs webhooks, 3 sends in 180 days and recorded clicks)';
  }

  // 5. Weekly digest draft
  const lastDigest = await Campaign.findOne({ origin: 'digest' }).sort({ createdAt: -1 }).select('createdAt').lean();
  if (!lastDigest || now - new Date(lastDigest.createdAt).getTime() > 6.5 * DAY) {
    const since = lastDigest ? new Date(lastDigest.createdAt) : new Date(now - 7 * DAY);
    const posts = await Post.find({ status: 'published', createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .select('title excerpt slug language')
      .limit(30)
      .lean();
    const editions: ICampaignEdition[] = [];
    for (const lang of NL_LANGS) {
      const mine = posts.filter((p) => (p.language ?? 'en') === lang).slice(0, 6);
      if (mine.length === 0) continue;
      const d = copyFor(lang).digest;
      const items = mine
        .map((p) => {
          const url = `${APP_URL}/${lang}/blog/${p.slug}`;
          return `<h2>${escHtml(p.title)}</h2>${p.excerpt ? `<p>${escHtml(p.excerpt)}</p>` : ''}<p><a href="${escHtml(url)}">${escHtml(d.read)}</a></p>`;
        })
        .join('');
      editions.push({ lang, subject: d.subject(mine[0]!.title).slice(0, 200), previewText: d.heading, bodyHtml: `${d.intro}${items}` });
    }
    if (editions.length > 0) {
      const main = editions.find((e) => e.lang === 'en') ?? editions[0]!;
      const draft = await Campaign.create({ subject: main.subject, previewText: main.previewText, status: 'draft', origin: 'digest', editions, fallbackToEnglish: true, isPublic: true });
      await notifyAdmin({
        type: 'newsletter_draft',
        title: 'Weekly digest draft ready',
        body: `${posts.length} new post${posts.length === 1 ? '' : 's'}. Review and send: "${main.subject}".`,
        link: `/rk-studio/newsletter/campaigns/${String(draft._id)}`,
      });
      report.digest = String(draft._id);
    } else {
      report.digest = 'no new posts';
    }
  }

  report.emailsLeft = budget;
  return NextResponse.json({ ok: true, ...report });
}
