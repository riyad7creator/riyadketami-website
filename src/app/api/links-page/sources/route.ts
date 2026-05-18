import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db/connect';
import LatestSourceModel from '@/models/LatestSource';
import { requireAdmin, serverError, zodFail } from '@/lib/api-helpers';
import { latestSourceSchema } from '@/lib/links-page-validation';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminView = searchParams.get('admin') === 'true';

    if (adminView) {
      const check = await requireAdmin();
      if (!check.ok) return check.response;
    }

    await dbConnect();
    const query = adminView ? {} : { active: true };
    const sources = await LatestSourceModel.find(query).sort({ order: 1 }).lean();
    return NextResponse.json(sources);
  } catch (error) {
    return serverError('Failed to fetch sources', error);
  }
}

export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const body = (await req.json()) as unknown;
    const result = latestSourceSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    await dbConnect();
    const maxOrder = await LatestSourceModel.find().sort({ order: -1 }).limit(1).lean();
    const order = result.data.order ?? ((maxOrder[0]?.order ?? -1) + 1);

    const source = await LatestSourceModel.create({ ...result.data, order });
    revalidateTag('links-page', 'max');
    return NextResponse.json(source.toObject(), { status: 201 });
  } catch (error) {
    return serverError('Failed to create source', error);
  }
}
