import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db/connect';
import SiteProfileModel from '@/models/SiteProfile';
import { requireAdmin, serverError, zodFail } from '@/lib/api-helpers';
import { siteProfileSchema } from '@/lib/links-page-validation';
import { DEFAULT_LINKS_PROFILE } from '@/lib/links-defaults';

export const DEFAULT_PROFILE = DEFAULT_LINKS_PROFILE;

export async function GET() {
  try {
    await dbConnect();
    const profile = await SiteProfileModel.findById('links-profile').lean();
    return NextResponse.json(profile ?? DEFAULT_PROFILE);
  } catch (error) {
    return serverError('Failed to fetch profile', error);
  }
}

export async function PATCH(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const body = (await req.json()) as unknown;
    const result = siteProfileSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    await dbConnect();
    const profile = await SiteProfileModel.findByIdAndUpdate(
      'links-profile',
      { $set: result.data },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    revalidateTag('links-page', 'max');
    return NextResponse.json(profile);
  } catch (error) {
    return serverError('Failed to update profile', error);
  }
}
