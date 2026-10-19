import { NextResponse } from 'next/server';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { sendCampaign, CampaignError } from '@/lib/newsletter/campaigns';

export const maxDuration = 300;
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** POST { scheduledAt?: ISO string }: send now, or schedule up to 30 days ahead */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await params;
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const body = await readJson<{ scheduledAt?: unknown }>(req).catch(() => ({} as { scheduledAt?: unknown }));
    let scheduledAt: Date | undefined;
    if (typeof body?.scheduledAt === 'string' && body.scheduledAt) {
      scheduledAt = new Date(body.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }
    const result = await sendCampaign(id, { scheduledAt });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CampaignError) return NextResponse.json({ error: error.message, ...error.extra }, { status: error.status });
    return serverError('Failed to send campaign', error);
  }
}
