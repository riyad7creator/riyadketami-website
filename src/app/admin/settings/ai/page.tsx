'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Loader2, Check, X, Zap, DollarSign, Cpu } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const MODELS = [
  { id: 'moonshotai/kimi-k2', label: 'Kimi K2 (Moonshot)', tier: 'mid' },
  { id: 'minimax/minimax-m1-40b', label: 'MiniMax M1 40B', tier: 'mid' },
  { id: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B', tier: 'small' },
  { id: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5', tier: 'small' },
  { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', tier: 'mid' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', tier: 'large' },
];

const TASK_LABELS: Record<string, string> = {
  ai_model_writing: 'Blog writing',
  ai_model_translation: 'Translation',
  ai_model_alttext: 'Alt-text generation',
  ai_model_agents: 'Agentic tools (SEO, post ideas, newsletter)',
};

interface Settings {
  ai_openrouter_key: string | null;
  ai_default_model: string | null;
  ai_model_writing: string | null;
  ai_model_translation: string | null;
  ai_model_alttext: string | null;
  ai_model_agents: string | null;
  ai_budget_usd: string | null;
}

interface Usage {
  totalPrompt: number;
  totalCompletion: number;
  totalCost: number;
  count: number;
  byModel: { _id: string; calls: number; cost: number }[];
  monthStart: string;
}

function ModelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-bg-0 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 focus:outline-none focus:border-matrix/50 transition-colors"
    >
      <option value="">— Use default model —</option>
      {MODELS.map(m => (
        <option key={m.id} value={m.id}>{m.label} ({m.tier})</option>
      ))}
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
        body: JSON.stringify({ key: keyInput || undefined }),
      });
      const data = await res.json() as { ok: boolean; modelCount?: number; error?: string };
      setTestResult({
        ok: data.ok,
        message: data.ok ? `Connected — ${data.modelCount} models available` : data.error ?? 'Connection failed',
      });
    } catch {
      setTestResult({ ok: false, message: 'Network error' });
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (keyInput) body['ai_openrouter_key'] = keyInput;
      if (settings.ai_default_model) body['ai_default_model'] = settings.ai_default_model;
      if (settings.ai_model_writing !== undefined) body['ai_model_writing'] = settings.ai_model_writing ?? '';
      if (settings.ai_model_translation !== undefined) body['ai_model_translation'] = settings.ai_model_translation ?? '';
      if (settings.ai_model_alttext !== undefined) body['ai_model_alttext'] = settings.ai_model_alttext ?? '';
      if (settings.ai_model_agents !== undefined) body['ai_model_agents'] = settings.ai_model_agents ?? '';
      if (settings.ai_budget_usd !== undefined) body['ai_budget_usd'] = settings.ai_budget_usd ?? '';

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

  const keyIsSet = settings.ai_openrouter_key === '••••••••';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-0">AI Settings</h1>
        <p className="text-sm text-text-2 mt-1">Configure OpenRouter API key and model preferences.</p>
      </div>

      {/* API Key */}
      <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-matrix" />
          <h2 className="font-semibold text-text-0">OpenRouter API Key</h2>
          {keyIsSet && (
            <span className="ml-auto text-[11px] font-mono bg-matrix/10 text-matrix px-2 py-0.5 rounded-full">configured</span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder={keyIsSet ? 'Enter new key to replace…' : 'sk-or-…'}
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

        <p className="text-[11px] text-text-2">
          Key is stored encrypted in the database. Get yours at{' '}
          <span className="text-matrix font-mono">openrouter.ai/keys</span>.
        </p>
      </div>

      {/* Default model */}
      <div className="glass border border-border rounded-[var(--radius-lg)] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-matrix" />
          <h2 className="font-semibold text-text-0">Model Selection</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Default model (fallback for all tasks)</label>
            <ModelSelect
              value={settings.ai_default_model ?? ''}
              onChange={v => setSettings(s => ({ ...s, ai_default_model: v }))}
            />
          </div>

          {Object.entries(TASK_LABELS).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-text-2 mb-1.5">{label}</label>
              <ModelSelect
                value={(settings as Record<string, string | null>)[key] ?? ''}
                onChange={v => setSettings(s => ({ ...s, [key]: v || null }))}
              />
            </div>
          ))}
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
            value={settings.ai_budget_usd ?? ''}
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
                  <span className="text-text-1">{m.calls} calls — ${m.cost.toFixed(4)}</span>
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
