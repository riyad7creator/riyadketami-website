import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Campaign from '@/models/Campaign';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { getNewsletterSettings } from '@/lib/newsletter/config';

/** GET: every campaign (drafts too), newest first, without bodies */
export async function GET() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  try {
    await dbConnect();
    const campaigns = await Campaign.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .select('-editions.bodyHtml')
      .lean();
    return NextResponse.json({ campaigns });
  } catch (error) {
    return serverError('Failed to list campaigns', error);
  }
}

/** POST: new draft ({ subject? }) */
export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  try {
    const body = await readJson<{ subject?: unknown }>(req).catch(() => ({} as { subject?: unknown }));
    const subject = typeof body?.subject === 'string' && body.subject.trim() ? body.subject.trim().slice(0, 200) : 'Untitled issue';
    await dbConnect();
    const settings = await getNewsletterSettings();
    const campaign = await Campaign.create({
      subject,
      status: 'draft',
      editions: [{ lang: 'en', subject: subject === 'Untitled issue' ? '' : subject, bodyHtml: '' }],
      isPublic: settings.archiveByDefault,
      fallbackToEnglish: true,
    });
    return NextResponse.json({ id: String(campaign._id) }, { status: 201 });
  } catch (error) {
    return serverError('Failed to create campaign', error);
  }
}
