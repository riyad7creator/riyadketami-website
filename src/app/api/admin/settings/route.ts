import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import { getSetting, setSetting } from '@/models/SiteSettings';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';

/** Settings readable by the public (no auth required) */
const PUBLIC_KEYS = new Set(['hero_image', 'profile_image']);

/**
 * Keys this generic endpoint may write. Everything else has its own validated
 * route (AI keys: /api/admin/ai-settings, site images/texts/links:
 * /api/admin/site-content), so arbitrary keys are rejected with 400.
 * The legacy hero/profile image keys are the only ones the Settings page used.
 */
const WRITABLE_KEYS = new Set(['hero_image', 'profile_image']);

/** Never returned by the "all settings" listing */
const SECRET_KEYS = new Set(['ai_openrouter_key', 'ai_anthropic_key']);

/** GET /api/admin/settings: all settings (admin) or ?key=xxx (public for whitelisted keys) */
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
      if (SECRET_KEYS.has(key)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const value = await getSetting(key);
      return NextResponse.json({ key, value: value ?? null });
    }

    // All settings — admin only
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const { default: SiteSettings } = await import('@/models/SiteSettings');
    const docs = await SiteSettings.find({}).lean();
    const result: Record<string, unknown> = {};
    for (const doc of docs) if (!SECRET_KEYS.has(doc.key)) result[doc.key] = doc.value;
    return NextResponse.json(result);
  } catch (error) {
    return serverError('Failed to fetch settings', error);
  }
}

/** POST /api/admin/settings: upsert { key, value } for allowlisted keys */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    const body = await readJson<{ key?: unknown; value?: unknown }>(req);
    if (!body || typeof body.key !== 'string' || !body.key) {
      return NextResponse.json({ error: 'key required' }, { status: 400 });
    }
    if (!WRITABLE_KEYS.has(body.key)) {
      return NextResponse.json({ error: `Unknown setting: ${body.key.slice(0, 60)}` }, { status: 400 });
    }
    if (body.value !== null && body.value !== undefined && typeof body.value !== 'string') {
      return NextResponse.json({ error: 'value must be a string or null' }, { status: 400 });
    }

    await dbConnect();
    await setSetting(body.key, body.value ?? null);
    return NextResponse.json({ success: true, key: body.key });
  } catch (error) {
    return serverError('Failed to save setting', error);
  }
}
