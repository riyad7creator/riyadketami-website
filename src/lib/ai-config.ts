import dbConnect from '@/lib/db/connect';
import SiteSettings from '@/models/SiteSettings';
import AIUsage from '@/models/AIUsage';
import { decrypt, isEncrypted } from '@/lib/encrypt';

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const MODEL_PRESETS = {
  writing: 'moonshotai/kimi-k2',
  translation: 'moonshotai/kimi-k2',
  alttext: 'google/gemini-flash-1.5',
  agents: 'minimax/minimax-m1-40b',
  seo: 'meta-llama/llama-3.1-8b-instruct',
} as const;

export type ModelTask = keyof typeof MODEL_PRESETS;

/** Resolve the OpenRouter API key: env var takes precedence, then DB. */
export async function getOpenRouterKey(): Promise<string | null> {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  try {
    await dbConnect();
    const doc = await SiteSettings.findOne({ key: 'ai_openrouter_key' }).lean() as { value?: string } | null;
    if (!doc?.value) return null;
    if (isEncrypted(doc.value)) return decrypt(doc.value);
    return doc.value;
  } catch {
    return null;
  }
}

/** Resolve the model for a given task from DB prefs, falling back to MODEL_PRESETS. */
export async function getModel(task: ModelTask): Promise<string> {
  try {
    await dbConnect();
    const settingKey = task === 'alttext' ? 'ai_model_alttext'
      : task === 'seo' ? 'ai_model_agents'
      : `ai_model_${task}`;
    const doc = await SiteSettings.findOne({ key: settingKey }).lean() as { value?: string } | null;
    if (doc?.value && typeof doc.value === 'string') return doc.value;
    // fall back to default model
    const def = await SiteSettings.findOne({ key: 'ai_default_model' }).lean() as { value?: string } | null;
    if (def?.value && typeof def.value === 'string') return def.value;
  } catch {
    // ignore
  }
  return MODEL_PRESETS[task];
}

/** Log AI usage (fire-and-forget). */
export function logUsage(opts: {
  model: string;
  promptTokens: number;
  completionTokens: number;
  route: string;
}) {
  // Rough cost estimate: $0.50/M prompt + $1.50/M completion (conservative mid-tier)
  const costUsd = (opts.promptTokens * 0.0000005) + (opts.completionTokens * 0.0000015);
  dbConnect()
    .then(() => AIUsage.create({
      modelName: opts.model,
      promptTokens: opts.promptTokens,
      completionTokens: opts.completionTokens,
      route: opts.route,
      costUsd,
    }))
    .catch(() => {});
}
