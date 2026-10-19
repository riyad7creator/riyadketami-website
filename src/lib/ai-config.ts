import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import SiteSettings from '@/models/SiteSettings';
import AIUsage from '@/models/AIUsage';
import { decrypt, isEncrypted } from '@/lib/encrypt';
import {
  MODEL_PRESETS, CLAUDE_PRESETS, CLAUDE_MODEL_OPTIONS, AI_PROVIDERS, DEFAULT_PROVIDER, PROVIDER_INFO,
  isClaudeModel, type ModelTask, type AIProvider,
} from '@/lib/ai-models';

export { MODEL_PRESETS, CLAUDE_PRESETS, type ModelTask, type AIProvider } from '@/lib/ai-models';

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS_URL = 'https://openrouter.ai/api/v1/models';
export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';
const CLAUDE_MAX_TOKENS = 8192;

export type KeySource = 'env' | 'saved' | null;

const KEY_SETTING: Record<AIProvider, string> = {
  claude: 'ai_anthropic_key',
  openrouter: 'ai_openrouter_key',
};

async function readSetting(key: string): Promise<string | null> {
  try {
    await dbConnect();
    const doc = await SiteSettings.findOne({ key }).lean() as { value?: unknown } | null;
    return doc?.value && typeof doc.value === 'string' ? doc.value : null;
  } catch {
    return null;
  }
}

async function savedKey(provider: AIProvider): Promise<string | null> {
  const value = await readSetting(KEY_SETTING[provider]);
  if (!value) return null;
  try {
    return isEncrypted(value) ? decrypt(value) : value;
  } catch {
    return null;
  }
}

/** Active provider: AI_PROVIDER env var, then Settings > AI switch, then Claude. */
export async function getProvider(): Promise<AIProvider> {
  const env = process.env.AI_PROVIDER as AIProvider | undefined;
  if (env && AI_PROVIDERS.includes(env)) return env;
  const saved = (await readSetting('ai_provider')) as AIProvider | null;
  return saved && AI_PROVIDERS.includes(saved) ? saved : DEFAULT_PROVIDER;
}

/** API key for a provider: env var takes precedence, then the saved (encrypted) key. */
export async function getProviderKey(provider: AIProvider): Promise<string | null> {
  return process.env[PROVIDER_INFO[provider].envVar] || savedKey(provider);
}

/** Key of the active provider (what every AI route uses). */
export async function getAIKey(): Promise<string | null> {
  return getProviderKey(await getProvider());
}

/** @deprecated kept for older imports; use getProviderKey('openrouter') */
export async function getOpenRouterKey(): Promise<string | null> {
  return getProviderKey('openrouter');
}

/** Where a provider's key comes from, for Settings > AI. */
export async function getKeySource(provider: AIProvider = 'openrouter'): Promise<KeySource> {
  if (process.env[PROVIDER_INFO[provider].envVar]) return 'env';
  return (await savedKey(provider)) ? 'saved' : null;
}

/** Error text when the active provider has no key. */
export async function missingKeyMessage(): Promise<string> {
  const p = PROVIDER_INFO[await getProvider()];
  return `${p.label} API key is not configured. Add it in Settings > AI.`;
}

// ---------------------------------------------------------------------------
// Model catalogue: OpenRouter public list (cached) + the Claude list
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

function claudeInfo(model: string): ModelInfo | null {
  const m = CLAUDE_MODEL_OPTIONS.find((o) => o.id === model);
  if (!m) return null;
  return {
    id: m.id,
    architecture: { input_modalities: m.vision ? ['text', 'image'] : ['text'] },
    pricing: { prompt: String(m.inPerM / 1e6), completion: String(m.outPerM / 1e6) },
  };
}

/** Model metadata, or null when unknown / list unavailable. */
export async function getModelInfo(model: string): Promise<ModelInfo | null> {
  if (isClaudeModel(model)) return claudeInfo(model);
  const byId = await loadCatalogue();
  return byId?.get(model) ?? null;
}

function taskSetting(task: ModelTask): string {
  return task === 'alttext' ? 'alttext' : task === 'seo' ? 'agents' : task;
}

/** Model for a task under the active provider: saved choice, then default, then preset. */
export async function getModel(task: ModelTask): Promise<string> {
  const provider = await getProvider();
  const prefix = provider === 'claude' ? 'ai_claude_' : 'ai_';
  let chosen = await readSetting(`${prefix}model_${taskSetting(task)}`);
  // alt text needs a vision model: the general default is not a safe fallback
  if (!chosen && task !== 'alttext') chosen = await readSetting(`${prefix}default_model`);

  if (provider === 'claude') {
    return chosen && CLAUDE_MODEL_OPTIONS.some((m) => m.id === chosen) ? chosen : CLAUDE_PRESETS[task];
  }
  if (chosen && !isClaudeModel(chosen)) {
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
// Chat calls (provider picked from the model ID)
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

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type ChatResult =
  | { ok: true; text: string }
  | { ok: false; status: number; error: string };

function upstreamError(provider: string, status: number, text: string): ChatResult {
  return {
    ok: false,
    status: status >= 400 && status < 600 ? status : 502,
    error: `${provider} error (${status}): ${text.slice(0, 300)}`,
  };
}

/** Anthropic Messages API body: system prompts move to `system`, an optional image joins the last user turn. */
function claudeBody(model: string, messages: ChatMessage[], imageUrl?: string, stream = false) {
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const turns = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: [{ type: 'text', text: m.content }] as Record<string, unknown>[] }));
  if (imageUrl) {
    const lastUser = [...turns].reverse().find((t) => t.role === 'user');
    lastUser?.content.unshift({ type: 'image', source: { type: 'url', url: imageUrl } });
  }
  return { model, max_tokens: CLAUDE_MAX_TOKENS, ...(system ? { system } : {}), messages: turns, ...(stream ? { stream: true } : {}) };
}

function claudeHeaders(apiKey: string) {
  return { 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_VERSION, 'content-type': 'application/json' };
}

/**
 * One chat completion with the provider that owns `model` (claude-* IDs go to
 * Anthropic, everything else to OpenRouter). Logs usage. `json` asks
 * OpenRouter for JSON mode when the model supports it.
 */
export async function aiChat(opts: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  route: string;
  temperature?: number;
  imageUrl?: string;
  json?: boolean;
  timeoutMs?: number;
}): Promise<ChatResult> {
  const signal = AbortSignal.timeout(opts.timeoutMs ?? 120_000);

  if (isClaudeModel(opts.model)) {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: claudeHeaders(opts.apiKey),
      body: JSON.stringify(claudeBody(opts.model, opts.messages, opts.imageUrl)),
      signal,
    });
    if (!res.ok) return upstreamError('Claude', res.status, await res.text().catch(() => ''));
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    logUsage({
      model: opts.model,
      promptTokens: data.usage?.input_tokens ?? 0,
      completionTokens: data.usage?.output_tokens ?? 0,
      route: opts.route,
    });
    return { ok: true, text: (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('') };
  }

  const jsonMode = opts.json
    ? (await getModelInfo(opts.model))?.supported_parameters?.includes('response_format') ?? false
    : false;
  const messages = opts.imageUrl
    ? opts.messages.map((m, i, all) =>
        i === all.length - 1 && m.role === 'user'
          ? { role: m.role, content: [{ type: 'text', text: m.content }, { type: 'image_url', image_url: { url: opts.imageUrl } }] }
          : m)
    : opts.messages;

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
      messages,
    }),
    signal,
  });
  if (!res.ok) return upstreamError('OpenRouter', res.status, await res.text().catch(() => ''));
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
  return { ok: true, text: data.choices?.[0]?.message?.content ?? '' };
}

export type JsonCallResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

/** Chat completion that must answer JSON (either provider). */
export async function aiJson<T>(opts: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  route: string;
  temperature?: number;
}): Promise<JsonCallResult<T>> {
  const result = await aiChat({ ...opts, json: true });
  if (!result.ok) return result;
  const parsed = parseJsonFromText<T>(result.text);
  if (parsed === null) return { ok: false, status: 502, error: 'The AI answer was not valid JSON. Try again or pick another model.' };
  return { ok: true, data: parsed };
}

/** @deprecated name kept for older imports; works with both providers */
export const openRouterJson = aiJson;

/**
 * Streaming chat for the blog writer. Always returns OpenAI-style SSE
 * (`data: {"choices":[{"delta":{"content":"..."}}]}`), so the client reads
 * Claude and OpenRouter the same way. Returns an error Response on failure.
 */
export async function aiStream(opts: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  route: string;
}): Promise<Response> {
  const sseHeaders = { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' };
  const errorResponse = (provider: string, status: number, text: string) =>
    new Response(JSON.stringify({ error: `${provider} error: ${text.slice(0, 300)}` }), {
      status: status >= 400 && status < 600 ? status : 502,
      headers: { 'Content-Type': 'application/json' },
    });

  if (!isClaudeModel(opts.model)) {
    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ketami.net',
        'X-Title': 'Riyad Ketami Admin',
      },
      body: JSON.stringify({ model: opts.model, stream: true, messages: opts.messages }),
    });
    if (!upstream.ok || !upstream.body) return errorResponse('OpenRouter', upstream.status, await upstream.text().catch(() => ''));
    return new Response(upstream.body, { headers: sseHeaders });
  }

  const upstream = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: claudeHeaders(opts.apiKey),
    body: JSON.stringify(claudeBody(opts.model, opts.messages, undefined, true)),
  });
  if (!upstream.ok || !upstream.body) return errorResponse('Claude', upstream.status, await upstream.text().catch(() => ''));

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();
  let buffer = '';
  let inputTokens = 0;
  let outputTokens = 0;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        logUsage({ model: opts.model, promptTokens: inputTokens, completionTokens: outputTokens, route: opts.route });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const evt = JSON.parse(line.slice(5).trim()) as {
            type?: string;
            delta?: { type?: string; text?: string };
            message?: { usage?: { input_tokens?: number } };
            usage?: { output_tokens?: number };
            error?: { message?: string };
          };
          if (evt.type === 'message_start') inputTokens = evt.message?.usage?.input_tokens ?? 0;
          else if (evt.type === 'message_delta') outputTokens = evt.usage?.output_tokens ?? outputTokens;
          else if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta' && evt.delta.text) {
            const chunk = { choices: [{ delta: { content: evt.delta.text } }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          } else if (evt.type === 'error') {
            const chunk = { choices: [{ delta: { content: `\n\n[Claude error: ${evt.error?.message ?? 'stream failed'}]` } }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
        } catch {
          // skip malformed lines
        }
      }
    },
    cancel() {
      void reader.cancel();
    },
  });
  return new Response(stream, { headers: sseHeaders });
}
