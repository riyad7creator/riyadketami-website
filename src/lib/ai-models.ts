// Pure constants (no DB imports): safe for the AI settings page and server code.
// IDs checked against https://openrouter.ai/api/v1/models on 19 Oct 2026; every
// preset lists response_format in supported_parameters, and the alt-text preset
// accepts image input.

export const MODEL_PRESETS = {
  writing: 'moonshotai/kimi-k2.6',
  translation: 'moonshotai/kimi-k2.6',
  alttext: 'google/gemini-2.5-flash',
  agents: 'minimax/minimax-m2.5',
  seo: 'minimax/minimax-m2.5',
} as const;

export type ModelTask = keyof typeof MODEL_PRESETS;

/** Options offered in Settings > AI */
export const MODEL_OPTIONS: { id: string; label: string; tier: string; vision?: boolean }[] = [
  { id: 'moonshotai/kimi-k2.6', label: 'Kimi K2.6 (Moonshot)', tier: 'mid', vision: true },
  { id: 'moonshotai/kimi-k2.5', label: 'Kimi K2.5 (Moonshot)', tier: 'mid', vision: true },
  { id: 'minimax/minimax-m2.5', label: 'MiniMax M2.5', tier: 'mid' },
  { id: 'minimax/minimax-m3', label: 'MiniMax M3', tier: 'mid', vision: true },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'small', vision: true },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', tier: 'small', vision: true },
  { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek V4 Flash', tier: 'small' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 mini', tier: 'mid', vision: true },
];

// ---------------------------------------------------------------------------
// Providers: Claude (Anthropic API) or OpenRouter, switched in Settings > AI
// ---------------------------------------------------------------------------

export type AIProvider = 'claude' | 'openrouter';
export const AI_PROVIDERS: AIProvider[] = ['claude', 'openrouter'];
export const DEFAULT_PROVIDER: AIProvider = 'claude';

export const PROVIDER_INFO: Record<AIProvider, { label: string; keyPlaceholder: string; keysUrl: string; envVar: string }> = {
  claude: { label: 'Claude', keyPlaceholder: 'sk-ant-...', keysUrl: 'platform.claude.com/settings/keys', envVar: 'ANTHROPIC_API_KEY' },
  openrouter: { label: 'OpenRouter', keyPlaceholder: 'sk-or-...', keysUrl: 'openrouter.ai/keys', envVar: 'OPENROUTER_API_KEY' },
};

// Claude API model IDs and list prices (USD per million tokens), checked on
// platform.claude.com/docs/en/about-claude/pricing on 19 Oct 2026.
export const CLAUDE_MODEL_OPTIONS: { id: string; label: string; tier: string; vision: boolean; inPerM: number; outPerM: number }[] = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', tier: 'large', vision: true, inPerM: 4, outPerM: 20 },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', tier: 'mid', vision: true, inPerM: 2, outPerM: 10 },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', tier: 'small', vision: true, inPerM: 0.1, outPerM: 0.5 },
];

export const CLAUDE_PRESETS: Record<ModelTask, string> = {
  writing: 'claude-sonnet-5-5',
  translation: 'claude-sonnet-5-5',
  alttext: 'claude-haiku-5-5',
  agents: 'claude-sonnet-5-5',
  seo: 'claude-sonnet-5-5',
};

export function isClaudeModel(id: string): boolean {
  return id.startsWith('claude-');
}
