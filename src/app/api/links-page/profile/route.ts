import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { revalidateLinksPage } from '@/lib/revalidate';
import dbConnect from '@/lib/db/connect';
import SiteProfileModel from '@/models/SiteProfile';
import { requireAdmin, serverError, zodFail, readJson } from '@/lib/api-helpers';
import { siteProfileSchema } from '@/lib/links-page-validation';
import { DEFAULT_LINKS_PROFILE } from '@/lib/links-defaults';

/** Drop Mongo bookkeeping fields before re-saving a stored document */
function stripMeta<T extends object>(doc: T): Partial<T> {
  const rest: Record<string, unknown> = { ...(doc as Record<string, unknown>) };
  for (const k of ['_id', '__v', 'createdAt', 'updatedAt']) delete rest[k];
  return rest as Partial<T>;
}

export async function GET() {
  try {
    await dbConnect();
    const profile = await SiteProfileModel.findById('links-profile').lean();
    return NextResponse.json(profile ?? DEFAULT_LINKS_PROFILE);
  } catch (error) {
    return serverError('Failed to fetch profile', error);
  }
}

export async function PATCH(req: Request) {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    const body = (await readJson(req)) as unknown;
    const result = siteProfileSchema.safeParse(body);
    if (!result.success) return zodFail(result.error);

    await dbConnect();
    // Merge defaults <- stored <- patch so a first save (upsert) writes a
    // complete document instead of one missing required fields.
    const existing = await SiteProfileModel.findById('links-profile').lean();
    const stored = (existing ?? {}) as Partial<typeof DEFAULT_LINKS_PROFILE>;
    const merged = {
      ...stripMeta(DEFAULT_LINKS_PROFILE),
      ...stripMeta(stored),
      ...result.data,
      socials: {
        ...DEFAULT_LINKS_PROFILE.socials,
        ...(stored.socials ?? {}),
        ...(result.data.socials ?? {}),
      },
    };
    const profile = await SiteProfileModel.findByIdAndUpdate(
      'links-profile',
      { $set: merged },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    revalidateTag('links-page', 'max');
    revalidateLinksPage();
    return NextResponse.json(profile);
  } catch (error) {
    return serverError('Failed to update profile', error);
  }
}
