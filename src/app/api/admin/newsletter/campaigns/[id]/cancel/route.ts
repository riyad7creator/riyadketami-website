import { NextResponse } from 'next/server';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { cancelScheduled, CampaignError } from '@/lib/newsletter/campaigns';

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

/** POST: cancel a scheduled campaign (back to draft) */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;
  const { id } = await params;
  if (!OBJECT_ID.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    await cancelScheduled(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CampaignError) return NextResponse.json({ error: error.message }, { status: error.status });
    return serverError('Failed to cancel campaign', error);
  }
}
