import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Campaign from '@/models/Campaign';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { sendTestEdition } from '@/lib/newsletter/mail';
import { hasContent } from '@/lib/newsletter/campaigns';
import { ADMIN_EMAIL } from '@/lib/resend';
import { rateLimit } from '@/lib/rate-limit';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** POST { lang? }: email the saved edition(s) to the signed-in admin */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const limited = await rateLimit(req, 10, 60_000, 'newsletter-test-send');
  if (limited) return limited;
  const { id } = await params;
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const body = await readJson<{ lang?: unknown }>(req).catch(() => ({} as { lang?: unknown }));
    await dbConnect();
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const to = check.session.user?.email || ADMIN_EMAIL;
    const editions = campaign.editions.filter((e) => !e.fallback && hasContent(e) && (!body?.lang || e.lang === body.lang));
    if (editions.length === 0) return NextResponse.json({ error: 'Save an edition with a subject and body first.' }, { status: 400 });
    const results = [];
    for (const e of editions) {
      const res = await sendTestEdition({ to, lang: e.lang, subject: e.subject, previewText: e.previewText, bodyHtml: e.bodyHtml });
      results.push({ lang: e.lang, ok: res.ok, ...(res.ok ? {} : { error: res.error }) });
    }
    const failed = results.filter((r) => !r.ok);
    return NextResponse.json({ to, results }, { status: failed.length === results.length ? 502 : 200 });
  } catch (error) {
    return serverError('Test send failed', error);
  }
}
