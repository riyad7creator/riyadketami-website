import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import SiteSettings from '@/models/SiteSettings';
import AIUsage from '@/models/AIUsage';
import { decrypt, isEncrypted } from '@/lib/encrypt';
import { MODEL_PRESETS, type ModelTask } from '@/lib/ai-models';

export { MODEL_PRESETS, type ModelTask } from '@/lib/ai-models';

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS_URL = 'https://openrouter.ai/api/v1/models';

export type KeySource = 'env' | 'saved' | null;

async function savedKey(): Promise<string | null> {
  try {
    await dbConnect();
    const doc = await SiteSettings.findOne({ key: 'ai_openrouter_key' }).lean() as { value?: string } | null;
    if (!doc?.value || typeof doc.value !== 'string') return null;
    if (isEncrypted(doc.value)) return decrypt(doc.value);
    return doc.value;
  } catch {
    return null;
  }
}

/** Resolve the OpenRouter API key: env var takes precedence, then DB. */
export async function getOpenRouterKey(): Promise<string | null> {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  return savedKey();
}

/** Where the active key comes from, for Settings > AI. */
export async function getKeySource(): Promise<KeySource> {
  if (process.env.OPENROUTER_API_KEY) return 'env';
  return (await savedKey()) ? 'saved' : null;
}

// ---------------------------------------------------------------------------
// Public model catalogue (no key needed), cached per server instance
// ---------------------------------------------------------------------------

export interface ModelInfo {
  id: string;
  supported_parameters?: string[];
  architecture?: { input_modalities?: string[] };
  pricing?: { prompt?: string; completion?: string };
}

let catalogue: { at: number; byId: Map<string, ModelInfo> } | null = null;
const CATALOGUE_TTL_MS = 60 * 60 * 1000;

async function loadCatalogue(): Promise<Map<string, ModelInfo> | null> {
  if (catalogue && Date.now() - catalogue.at < CATALOGUE_TTL_MS) return catalogue.byId;
  try {
    const res = await fetch(MODELS_URL, { signal: AbortSignal.timeout(5000), cache: 'no-store' });
    if (!res.ok) return catalogue?.byId ?? null;
    const json = (await res.json()) as { data?: ModelInfo[] };
    const byId = new Map((json.data ?? []).map((m) => [m.id, m]));
    if (byId.size > 0) catalogue = { at: Date.now(), byId };
    return catalogue?.byId ?? null;
  } catch {
    return catalogue?.byId ?? null;
  }
}

/** Model metadata from the public list, or null when unknown / list unavailable. */
export async function getModelInfo(model: string): Promise<ModelInfo | null> {
  const byId = await loadCatalogue();
  return byId?.get(model) ?? null;
}

/** Resolve the model for a given task from DB prefs, falling back to MODEL_PRESETS. */
export async function getModel(task: ModelTask): Promise<string> {
  let chosen: string | null = null;
  try {
    await dbConnect();
    const settingKey = task === 'alttext' ? 'ai_model_alttext'
      : task === 'seo' ? 'ai_model_agents'
      : `ai_model_${task}`;
    const doc = await SiteSettings.findOne({ key: settingKey }).lean() as { value?: string } | null;
    if (doc?.value && typeof doc.value === 'string') chosen = doc.value;
    // alt text needs a vision model: the general default is not a safe fallback
    if (!chosen && task !== 'alttext') {
      const def = await SiteSettings.findOne({ key: 'ai_default_model' }).lean() as { value?: string } | null;
      if (def?.value && typeof def.value === 'string') chosen = def.value;
    }
  } catch {
    // ignore
  }
  if (chosen) {
    // A saved ID that OpenRouter no longer lists (retired model) falls back to the preset
    const byId = await loadCatalogue();
    if (!byId || byId.has(chosen)) return chosen;
  }
  return MODEL_PRESETS[task];
}

// ---------------------------------------------------------------------------
// Usage + budget
// ---------------------------------------------------------------------------

/** Log AI usage (fire-and-forget). Cost uses the model's listed price when known. */
export function logUsage(opts: {
  model: string;
  promptTokens: number;
  completionTokens: number;
  route: string;
}) {
  void (async () => {
    const info = await getModelInfo(opts.model).catch(() => null);
    const promptPrice = Number(info?.pricing?.prompt);
    const completionPrice = Number(info?.pricing?.completion);
    // Fallback estimate: $0.50/M prompt + $1.50/M completion (conservative mid-tier)
    const costUsd =
      opts.promptTokens * (Number.isFinite(promptPrice) ? promptPrice : 0.0000005) +
      opts.completionTokens * (Number.isFinite(completionPrice) ? completionPrice : 0.0000015);
    await dbConnect();
    await AIUsage.create({
      modelName: opts.model,
      promptTokens: opts.promptTokens,
      completionTokens: opts.completionTokens,
      route: opts.route,
      costUsd,
    });
  })().catch(() => {});
}

/**
 * Enforce the monthly cap saved as ai_budget_usd (Settings > AI).
 * Returns a 402 response when this month's logged spend reached the cap, else null.
 */
export async function checkBudget(): Promise<NextResponse | null> {
  try {
    await dbConnect();
    const doc = await SiteSettings.findOne({ key: 'ai_budget_usd' }).lean() as { value?: unknown } | null;
    const budget = Number(doc?.value);
    if (!doc?.value || !Number.isFinite(budget) || budget <= 0) return null;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [row] = await AIUsage.aggregate<{ total: number }>([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$costUsd' } } },
    ]);
    const spent = row?.total ?? 0;
    if (spent >= budget) {
      return NextResponse.json(
        { error: `Monthly AI budget reached ($${spent.toFixed(2)} of $${budget.toFixed(2)}). Raise it in Settings > AI.` },
        { status: 402 }
      );
    }
  } catch {
    // Budget lookup failure must not block the studio
  }
  return null;
}

// ---------------------------------------------------------------------------
// JSON calls
// ---------------------------------------------------------------------------

/** Parse JSON from model text: strips ``` fences and surrounding prose. */
export function parseJsonFromText<T = unknown>(raw: string): T | null {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // fall through to the first {...} or [...] block
  }
  const start = cleaned.search(/[[{]/);
  if (start === -1) return null;
  const open = cleaned[start];
  const end = cleaned.lastIndexOf(open === '{' ? '}' : ']');
  if (end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type JsonCallResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

/**
 * Chat completion that must answer JSON. Sends response_format only when the
 * model lists it in supported_parameters; otherwise parses JSON from the text.
 */
export async function openRouterJson<T>(opts: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  route: string;
  temperature?: number;
}): Promise<JsonCallResult<T>> {
  const info = await getModelInfo(opts.model);
  const jsonMode = info?.supported_parameters?.includes('response_format') ?? false;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://ketami.net',
      'X-Title': 'Riyad Ketami Admin',
    },
    body: JSON.stringify({
      model: opts.model,
      stream: false,
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      messages: opts.messages,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, status: res.status >= 400 && res.status < 600 ? res.status : 502, error: `AI error (${res.status}): ${text.slice(0, 300)}` };
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  logUsage({
    model: opts.model,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
    route: opts.route,
  });

  const parsed = parseJsonFromText<T>(data.choices?.[0]?.message?.content ?? '');
  if (parsed === null) return { ok: false, status: 502, error: 'The AI answer was not valid JSON. Try again or pick another model.' };
  return { ok: true, data: parsed };
}
