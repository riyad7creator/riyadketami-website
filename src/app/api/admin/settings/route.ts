import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { getSetting, setSetting } from '@/models/SiteSettings';
import { requireAdmin, serverError } from '@/lib/api-helpers';

/** Settings readable by the public (no auth required) */
const PUBLIC_KEYS = new Set(['hero_image', 'profile_image']);

/** GET /api/admin/settings — all settings (admin) or ?key=xxx (public for whitelisted keys) */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    await dbConnect();

    if (key) {
      // Public keys can be read without auth
      if (!PUBLIC_KEYS.has(key)) {
        const check = await requireAdmin();
        if (!check.ok) return check.response;
      }
      const value = await getSetting(key);
      return NextResponse.json({ key, value: value ?? null });
    }

    // All settings — admin only
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { default: SiteSettings } = await import('@/models/SiteSettings');
    const docs = await SiteSettings.find({}).lean();
    const result: Record<string, unknown> = {};
    for (const doc of docs) result[doc.key] = doc.value;
    return NextResponse.json(result);
  } catch (error) {
    return serverError('Failed to fetch settings', error);
  }
}

/** POST /api/admin/settings — upsert { key, value } */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const body = (await req.json()) as { key?: string; value?: unknown };
    if (!body.key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    await dbConnect();
    await setSetting(body.key, body.value ?? null);
    return NextResponse.json({ success: true, key: body.key });
  } catch (error) {
    return serverError('Failed to save setting', error);
  }
}
