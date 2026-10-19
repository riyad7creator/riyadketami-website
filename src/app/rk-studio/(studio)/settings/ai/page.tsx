'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Loader2, Check, X, Zap, DollarSign, Cpu, Sparkles, Network } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  MODEL_OPTIONS, MODEL_PRESETS, CLAUDE_MODEL_OPTIONS, CLAUDE_PRESETS, PROVIDER_INFO, type AIProvider,
} from '@/lib/ai-models';

type ModelOption = { id: string; label: string; tier: string; vision?: boolean };

const TASKS = [
  { task: 'writing', label: 'Blog writing' },
  { task: 'translation', label: 'Translation' },
  { task: 'alttext', label: 'Alt-text generation' },
  { task: 'agents', label: 'Agentic tools (SEO, post ideas, newsletter)' },
] as const;

const PROVIDER_CONFIG: Record<AIProvider, {
  models: ModelOption[];
  presets: Record<string, string>;
  keyField: 'ai_anthropic_key' | 'ai_openrouter_key';
  prefix: 'ai_claude_' | 'ai_';
  icon: typeof Sparkles;
  blurb: string;
}> = {
  claude: {
    models: CLAUDE_MODEL_OPTIONS,
    presets: CLAUDE_PRESETS,
    keyField: 'ai_anthropic_key',
    prefix: 'ai_claude_',
    icon: Sparkles,
    blurb: 'Claude API (Opus, Sonnet, Haiku), billed per use on your Claude Console account.',
  },
  openrouter: {
    models: MODEL_OPTIONS,
    presets: MODEL_PRESETS,
    keyField: 'ai_openrouter_key',
    prefix: 'ai_',
    icon: Network,
    blurb: 'One key for Kimi, MiniMax, Gemini, DeepSeek, GPT and more.',
  },
};

type Settings = {
  [key: string]: unknown;
  ai_provider?: AIProvider;
  ai_provider_locked?: boolean;
  ai_key_sources?: Record<AIProvider, 'env' | 'saved' | null>;
};

interface Usage {
  totalPrompt: number;
  totalCompletion: number;
  totalCost: number;
  count: number;
  byModel: { _id: string; calls: number; cost: number }[];
  monthStart: string;
}

function ModelSelect({ value, onChange, models }: { value: string; onChange: (v: string) => void; models: ModelOption[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-bg-0 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 focus:outline-none focus:border-matrix/50 transition-colors"
    >
      <option value="">Use default model</option>
      {models.map(m => (
        <option key={m.id} value={m.id}>{m.label} ({m.tier}{m.vision ? ', vision' : ''})</option>
      ))}
      {value && !models.some(m => m.id === value) && <option value={value}>{value} (saved)</option>}
    </select>
  );
}

export default function AISettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [usage, setUsage] = useState<Usage | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<AIProvider | null>(null);
  const provider: AIProvider = settings.ai_provider ?? 'claude';
  const cfg = PROVIDER_CONFIG[provider];
  const val = (k: string) => (typeof settings[k] === 'string' ? (settings[k] as string) : '');

  const load = useCallback(async () => {
    try {
      const [sRes, uRes] = await Promise.all([
        fetch('/api/admin/ai-settings'),
        fetch('/api/admin/ai-usage'),
      ]);
      if (sRes.ok) setSettings(await sRes.json() as Settings);
      if (uRes.ok) setUsage(await uRes.json() as Usage);
    } catch {
      toast('Failed to load AI settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyInput || undefined, provider }),
      });
      const data = await res.json() as { ok: boolean; source?: string; label?: string | null; error?: string };
      const from = data.source === 'env' ? 'environment key' : data.source === 'saved' ? 'saved key' : 'typed key';
      setTestResult({
        ok: data.ok,
        message: data.ok ? `Connected with the ${from}${data.label ? ` (${data.label})` : ''}` : data.error ?? 'Connection failed',
      });
    } catch {
      setTestResult({ ok: false, message: 'Network error' });
    } finally {
      setTesting(false);
    }
  };

  const switchProvider = async (next: AIProvider) => {
    if (next === provider || settings.ai_provider_locked) return;
    setSwitching(next);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_provider: next }),
      });
      if (!res.ok) throw new Error('Switch failed');
      setKeyInput('');
      setTestResult(null);
      toast(`AI tools now use ${PROVIDER_INFO[next].label}`, 'success');
      await load();
    } catch {
      toast('Could not switch provider', 'error');
    } finally {
      setSwitching(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (keyInput) body[cfg.keyField] = keyInput;
      for (const field of [`${cfg.prefix}default_model`, ...TASKS.map(t => `${cfg.prefix}model_${t.task}`), 'ai_budget_usd']) {
        if (settings[field] !== undefined) body[field] = (settings[field] as string | null) ?? '';
      }

      const res = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Save failed');
      toast('AI settings saved', 'success');
      setKeyInput('');
      await load();
    } catch {
      toast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-text-2" />
      </div>
    );
  }

  const keyIsSet = settings[cfg.keyField] === '••••••••';
  const keySource = settings.ai_key_sources?.[provider] ?? null;
  const info = PROVIDER_INFO[provider];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-0">AI Settings</h1>
        <p className="text-sm text-text-2 mt-1">Pick the AI provider, add its API key and choose models.</p>
      </div>

      {/* Provider switch */}
      <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-3">
        <h2 className="font-semibold text-text-0 text-sm">AI provider</h2>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="AI provider">
          {(Object.keys(PROVIDER_CONFIG) as AIProvider[]).map(p => {
            const Icon = PROVIDER_CONFIG[p].icon;
            const active = p === provider;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => switchProvider(p)}
                disabled={!!switching || !!settings.ai_provider_locked}
                className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors disabled:cursor-not-allowed ${
                  active ? 'border-matrix bg-matrix/10' : 'border-border hover:border-border-hover'
                }`}
              >
                {switching === p ? <Loader2 size={16} className="mt-0.5 animate-spin text-matrix" /> : <Icon size={16} className={`mt-0.5 ${active ? 'text-matrix' : 'text-text-2'}`} />}
                <span>
                  <span className={`block text-sm font-semibold ${active ? 'text-text-0' : 'text-text-1'}`}>
                    {active ? `Using ${PROVIDER_INFO[p].label}` : `Switch to ${PROVIDER_INFO[p].label}`}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-text-2">{PROVIDER_CONFIG[p].blurb}</span>
                  <span className="mt-1 block font-mono text-[10px] text-text-2/80">
                    key: {settings.ai_key_sources?.[p] === 'env' ? 'environment' : settings.ai_key_sources?.[p] === 'saved' ? 'saved' : 'missing'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {settings.ai_provider_locked && (
          <p className="text-[11px] text-warning">The AI_PROVIDER environment variable fixes the provider; remove it to switch here.</p>
        )}
      </div>

      {/* API Key */}
      <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-matrix" />
          <h2 className="font-semibold text-text-0">{info.label} API Key</h2>
          {keySource && (
            <span className="ml-auto text-[11px] font-mono bg-matrix/10 text-matrix px-2 py-0.5 rounded-full">
              {keySource === 'env' ? `active: environment (${info.envVar})` : 'active: saved key'}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder={keyIsSet ? 'Enter new key to replace' : info.keyPlaceholder}
              className="w-full bg-bg-0 border border-border rounded-[var(--radius-md)] px-3 py-2 pr-9 text-sm text-text-0 placeholder:text-text-2/50 focus:outline-none focus:border-matrix/50 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(s => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-2 hover:text-text-1 transition-colors"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            onClick={testConnection}
            disabled={testing}
            className="px-3 py-2 text-sm bg-surface border border-border rounded-[var(--radius-md)] text-text-1 hover:text-text-0 hover:border-border-hover transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : 'Test connection'}
          </button>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 text-sm ${testResult.ok ? 'text-matrix' : 'text-danger'}`}>
            {testResult.ok ? <Check size={14} /> : <X size={14} />}
            {testResult.message}
          </div>
        )}

        {keySource === 'env' && keyIsSet && (
          <p className="text-[11px] text-warning">
            A saved key also exists, but {info.envVar} in the environment takes precedence.
          </p>
        )}
        <p className="text-[11px] text-text-2">
          Key is stored encrypted in the database. Get yours at{' '}
          <span className="text-matrix font-mono">{info.keysUrl}</span>.
        </p>
      </div>

      {/* Default model */}
      <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-matrix" />
          <h2 className="font-semibold text-text-0">{info.label} models</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Default model (fallback for writing, translation and agent tasks)</label>
            <ModelSelect
              models={cfg.models}
              value={val(`${cfg.prefix}default_model`)}
              onChange={v => setSettings(s => ({ ...s, [`${cfg.prefix}default_model`]: v }))}
            />
          </div>

          {TASKS.map(({ task, label }) => {
            const field = `${cfg.prefix}model_${task}`;
            return (
              <div key={field}>
                <label className="block text-xs text-text-2 mb-1.5">
                  {label}
                  <span className="ms-2 font-mono text-[10px] text-text-2/70">preset: {cfg.presets[task]}</span>
                </label>
                <ModelSelect
                  models={cfg.models}
                  value={val(field)}
                  onChange={v => setSettings(s => ({ ...s, [field]: v || null }))}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign size={15} className="text-matrix" />
          <h2 className="font-semibold text-text-0">Monthly Budget Cap</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-2 text-sm">$</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={val('ai_budget_usd')}
            onChange={e => setSettings(s => ({ ...s, ai_budget_usd: e.target.value }))}
            placeholder="10.00"
            className="w-32 bg-bg-0 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 focus:outline-none focus:border-matrix/50 transition-colors"
          />
          <span className="text-xs text-text-2">USD / month. AI calls stop when exceeded.</span>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-3">
          <h2 className="font-semibold text-text-0 text-sm">Usage this month</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface rounded-[var(--radius-md)] p-3 text-center">
              <p className="text-xl font-display font-bold text-text-0">{usage.count}</p>
              <p className="text-[11px] text-text-2 mt-0.5">API calls</p>
            </div>
            <div className="bg-surface rounded-[var(--radius-md)] p-3 text-center">
              <p className="text-xl font-display font-bold text-text-0">
                {((usage.totalPrompt + usage.totalCompletion) / 1000).toFixed(1)}k
              </p>
              <p className="text-[11px] text-text-2 mt-0.5">tokens</p>
            </div>
            <div className="bg-surface rounded-[var(--radius-md)] p-3 text-center">
              <p className="text-xl font-display font-bold text-matrix">${usage.totalCost.toFixed(3)}</p>
              <p className="text-[11px] text-text-2 mt-0.5">est. cost</p>
            </div>
          </div>
          {usage.byModel.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {usage.byModel.map(m => (
                <div key={m._id} className="flex items-center justify-between text-xs">
                  <span className="text-text-2 font-mono truncate max-w-[60%]">{m._id}</span>
                  <span className="text-text-1">{m.calls} calls · ${m.cost.toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-matrix text-bg-0 rounded-[var(--radius-md)] text-sm font-semibold hover:bg-matrix/90 disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Save settings
      </button>
    </div>
  );
}
