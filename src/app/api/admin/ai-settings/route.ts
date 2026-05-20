import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import SiteSettings from '@/models/SiteSettings';
import { requireAdmin, serverError } from '@/lib/api-helpers';
import { encrypt, decrypt, isEncrypted } from '@/lib/encrypt';

const AI_KEYS = [
  'ai_openrouter_key',
  'ai_default_model',
  'ai_model_writing',
  'ai_model_translation',
  'ai_model_agents',
  'ai_model_alttext',
  'ai_budget_usd',
] as const;

type AiSettingKey = typeof AI_KEYS[number];

async function getSetting(key: string): Promise<string | null> {
  const doc = await SiteSettings.findOne({ key }).lean() as { value?: unknown } | null;
  if (!doc?.value || typeof doc.value !== 'string') return null;
  if (key === 'ai_openrouter_key' && isEncrypted(doc.value)) {
    try { return decrypt(doc.value); } catch { return null; }
  }
  return doc.value;
}

async function setSetting(key: string, value: string) {
  const stored = key === 'ai_openrouter_key' ? encrypt(value) : value;
  await SiteSettings.updateOne({ key }, { $set: { value: stored } }, { upsert: true });
}

/** GET /api/admin/ai-settings — load all AI settings */
export async function GET() {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const settings: Record<string, string | null> = {};
    await Promise.all(
      AI_KEYS.map(async (key) => {
        const value = await getSetting(key);
        // Mask the key — return placeholder so UI knows it's set
        settings[key] = key === 'ai_openrouter_key' && value ? '••••••••' : value;
      })
    );
    return NextResponse.json(settings);
  } catch (error) {
    return serverError('Failed to load AI settings', error);
  }
}

/** POST /api/admin/ai-settings — save AI settings */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await req.json() as Partial<Record<AiSettingKey, string>>;

    await Promise.all(
      Object.entries(body)
        .filter(([key]) => AI_KEYS.includes(key as AiSettingKey))
        .map(([key, value]) => value !== undefined ? setSetting(key, value) : Promise.resolve())
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Failed to save AI settings', error);
  }
}

/** GET /api/admin/ai-settings?action=test — test OpenRouter connection */
export async function PATCH(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await req.json() as { key?: string };
    const apiKey = body.key ?? await getSetting('ai_openrouter_key');
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No API key configured' }, { status: 400 });

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return NextResponse.json({ ok: false, error: `OpenRouter returned ${res.status}` });

    const data = await res.json() as { data?: unknown[] };
    return NextResponse.json({ ok: true, modelCount: data.data?.length ?? 0 });
  } catch (error) {
    return serverError('Connection test failed', error);
  }
}
