import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import SiteSettings from '@/models/SiteSettings';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { encrypt, decrypt, isEncrypted } from '@/lib/encrypt';
import { getOpenRouterKey, getKeySource } from '@/lib/ai-config';

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

/** GET /api/admin/ai-settings: load all AI settings (+ ai_key_source: 'env' | 'saved' | null) */
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
    // The env var wins over a saved key; tell the UI which one is live
    return NextResponse.json({ ...settings, ai_key_source: await getKeySource() });
  } catch (error) {
    return serverError('Failed to load AI settings', error);
  }
}

/** POST /api/admin/ai-settings: save AI settings */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await readJson<Partial<Record<AiSettingKey, unknown>>>(req);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    await Promise.all(
      Object.entries(body)
        .filter(([key, value]) => AI_KEYS.includes(key as AiSettingKey) && typeof value === 'string')
        .map(([key, value]) => setSetting(key, (value as string).trim()))
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Failed to save AI settings', error);
  }
}

/** PATCH /api/admin/ai-settings: test the OpenRouter connection ({ key? } or the active key) */
export async function PATCH(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await readJson<{ key?: unknown }>(req);
    const typed = typeof body?.key === 'string' && body.key.trim() ? body.key.trim() : null;
    // Same resolution as the AI routes: env var first, then the saved key
    const apiKey = typed ?? await getOpenRouterKey();
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No API key configured' }, { status: 400 });
    const source = typed ? 'typed' : await getKeySource();

    // /models is public; /key actually validates the key
    const res = await fetch('https://openrouter.ai/api/v1/key', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return NextResponse.json({ ok: false, source, error: `OpenRouter rejected the key (${res.status})` });

    const data = await res.json() as { data?: { label?: string; limit?: number | null; usage?: number } };
    return NextResponse.json({ ok: true, source, label: data.data?.label ?? null, usage: data.data?.usage ?? null, limit: data.data?.limit ?? null });
  } catch (error) {
    return serverError('Connection test failed', error);
  }
}
