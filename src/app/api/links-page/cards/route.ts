import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db/connect';
import LinkCardModel from '@/models/LinkCard';
import type { LinkCardSection } from '@/models/LinkCard';
import { requireAdmin, serverError, zodFail } from '@/lib/api-helpers';
import { linkCardSchema } from '@/lib/links-page-validation';

function isActiveNow(card: { active: boolean; startsAt?: Date | null; endsAt?: Date | null }) {
  if (!card.active) return false;
  const now = new Date();
  if (card.startsAt && now < card.startsAt) return false;
  if (card.endsAt && now > card.endsAt) return false;
  return true;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get('section') as LinkCardSection | null;
    const adminView = searchParams.get('admin') === 'true';

    // Admin view requires auth
    if (adminView) {
      const check = await requireAdmin();
      if (!check.ok) return check.response;
    }

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (section) query.section = section;

    const cards = await LinkCardModel.find(query).sort({ section: 1, order: 1 }).lean();

    // Non-admin: filter by active + date range server-side
    const result = adminView
      ? cards
      : cards.filter((c) =>
          isActiveNow(c as { active: boolean; startsAt?: Date | null; endsAt?: Date | null })
        );

    return NextResponse.json(result);
  } catch (error) {
    return serverError('Failed to fetch cards', error);
  }
}

export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const body = (await req.json()) as unknown;
    const result = linkCardSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    await dbConnect();

    // Auto-assign order = max + 1 within section
    const maxOrder = await LinkCardModel.find({ section: result.data.section })
      .sort({ order: -1 })
      .limit(1)
      .lean();
    const order = result.data.order ?? ((maxOrder[0]?.order ?? -1) + 1);

    const { startsAt, endsAt, ...rest } = result.data;
    const card = await LinkCardModel.create({
      ...rest,
      order,
      ...(startsAt != null && { startsAt }),
      ...(endsAt != null && { endsAt }),
    });
    revalidateTag('links-page', {});
    return NextResponse.json(card.toObject(), { status: 201 });
  } catch (error) {
    return serverError('Failed to create card', error);
  }
}
