import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAdmin, serverError } from '@/lib/api-helpers';

/** POST /api/links-page/refresh — force-revalidates the RSS + links-page cache tags */
export async function POST() {
  const check = await requireAdmin();
  if (!check.ok) return check.response;

  try {
    revalidateTag('rss', 'max');
    revalidateTag('links-page', 'max');
    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError('Failed to revalidate cache', error);
  }
}
