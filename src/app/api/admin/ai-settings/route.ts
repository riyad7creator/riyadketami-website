import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import SiteSettings from '@/models/SiteSettings';
import { requireAdmin, serverError, readJson } from '@/lib/api-helpers';
import { encrypt, decrypt, isEncrypted } from '@/lib/encrypt';
import { getProvider, getProviderKey, getKeySource, getModel, ANTHROPIC_VERSION } from '@/lib/ai-config';
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai-models';

const SECRET_KEYS = ['ai_openrouter_key', 'ai_anthropic_key'] as const;

const AI_KEYS = [
  'ai_provider',
  ...SECRET_KEYS,
  'ai_default_model',
  'ai_model_writing',
  'ai_model_translation',
  'ai_model_agents',
  'ai_model_alttext',
  'ai_claude_default_model',
  'ai_claude_model_writing',
  'ai_claude_model_translation',
  'ai_claude_model_agents',
  'ai_claude_model_alttext',
  'ai_budget_usd',
] as const;

type AiSettingKey = typeof AI_KEYS[number];
const isSecret = (key: string) => (SECRET_KEYS as readonly string[]).includes(key);

async function getSetting(key: string): Promise<string | null> {
  const doc = await SiteSettings.findOne({ key }).lean() as { value?: unknown } | null;
  if (!doc?.value || typeof doc.value !== 'string') return null;
  if (isSecret(key) && isEncrypted(doc.value)) {
    try { return decrypt(doc.value); } catch { return null; }
  }
  return doc.value;
}

async function setSetting(key: string, value: string) {
  const stored = isSecret(key) && value ? encrypt(value) : value;
  await SiteSettings.updateOne({ key }, { $set: { value: stored } }, { upsert: true });
}

/**
 * GET /api/admin/ai-settings: all AI settings. Keys are masked. Also returns the
 * active provider, where each provider's key comes from, and the model each task uses now.
 */
export async function GET() {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const settings: Record<string, unknown> = {};
    await Promise.all(
      AI_KEYS.map(async (key) => {
        const value = await getSetting(key);
        settings[key] = isSecret(key) && value ? '••••••••' : value;
      })
    );
    const [provider, claudeSource, openrouterSource, writing, translation, alttext, agents] = await Promise.all([
      getProvider(),
      getKeySource('claude'),
      getKeySource('openrouter'),
      getModel('writing'),
      getModel('translation'),
      getModel('alttext'),
      getModel('agents'),
    ]);
    return NextResponse.json({
      ...settings,
      ai_provider: provider,
      ai_provider_locked: Boolean(process.env.AI_PROVIDER),
      ai_key_sources: { claude: claudeSource, openrouter: openrouterSource },
      ai_key_source: provider === 'claude' ? claudeSource : openrouterSource,
      ai_active_models: { writing, translation, alttext, agents },
    });
  } catch (error) {
    return serverError('Failed to load AI settings', error);
  }
}

/** POST /api/admin/ai-settings: save AI settings (empty key strings are ignored, never wipe a key) */
export async function POST(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await readJson<Partial<Record<AiSettingKey, unknown>>>(req);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    if (body.ai_provider !== undefined && !AI_PROVIDERS.includes(body.ai_provider as AIProvider)) {
      return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    await Promise.all(
      Object.entries(body)
        .filter(([key, value]) => AI_KEYS.includes(key as AiSettingKey) && typeof value === 'string')
        .filter(([key, value]) => !(isSecret(key) && !(value as string).trim()))
        .map(([key, value]) => setSetting(key, (value as string).trim()))
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError('Failed to save AI settings', error);
  }
}

/** PATCH /api/admin/ai-settings: test a provider ({ provider?, key? }; defaults to the active provider and its key) */
export async function PATCH(req: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) return check.response;

    await dbConnect();
    const body = await readJson<{ key?: unknown; provider?: unknown }>(req);
    const provider: AIProvider = AI_PROVIDERS.includes(body?.provider as AIProvider)
      ? (body!.provider as AIProvider)
      : await getProvider();
    const typed = typeof body?.key === 'string' && body.key.trim() ? body.key.trim() : null;
    const apiKey = typed ?? await getProviderKey(provider);
    if (!apiKey) return NextResponse.json({ ok: false, error: 'No API key configured' }, { status: 400 });
    const source = typed ? 'typed' : await getKeySource(provider);

    if (provider === 'claude') {
      // Listing models validates the key without spending tokens
      const res = await fetch('https://api.anthropic.com/v1/models?limit=1', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_VERSION },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return NextResponse.json({ ok: false, source, error: `Claude rejected the key (${res.status})` });
      return NextResponse.json({ ok: true, source, label: 'Claude API' });
    }

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
