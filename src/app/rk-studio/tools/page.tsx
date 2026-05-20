'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Wand2, ImageIcon, Lightbulb, Mail, Stethoscope, Languages, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

interface ToolCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  model: string;
  children: React.ReactNode;
}

function ToolCard({ icon: Icon, title, description, model, children }: ToolCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass border border-border rounded-[var(--radius-lg)] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface transition-colors text-left"
      >
        <div className="p-2 bg-matrix/10 rounded-[var(--radius-md)] shrink-0">
          <Icon size={16} className="text-matrix" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-0">{title}</p>
          <p className="text-xs text-text-2 mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono bg-bg-0 border border-border text-text-2 px-2 py-0.5 rounded-full">{model}</span>
          {open ? <ChevronUp size={14} className="text-text-2" /> : <ChevronDown size={14} className="text-text-2" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 text-text-2 hover:text-matrix transition-colors"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-matrix" /> : <Copy size={13} />}
    </button>
  );
}

// ── Tool: Alt text generator ─────────────────────────────────────────────────
function AltTextTool() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ updated: number; total: number } | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/ai/alt-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json() as { updated: number; total: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setResult(data);
      toast(`Updated ${data.updated} images`, 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-2">Scans up to 20 images missing alt text and generates descriptions using a vision model. Alt text helps accessibility and SEO.</p>
      <button onClick={run} disabled={running} className="flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-50 transition-colors">
        {running ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
        {running ? 'Generating…' : 'Run on missing images'}
      </button>
      {result && (
        <p className="text-sm text-matrix">Updated {result.updated} of {result.total} images.</p>
      )}
    </div>
  );
}

// ── Tool: Post ideas ──────────────────────────────────────────────────────────
function PostIdeasTool() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [ideas, setIdeas] = useState<{ title: string; hook: string; category: string }[]>([]);
  const [lang, setLang] = useState('en');

  const run = async () => {
    setRunning(true);
    setIdeas([]);
    try {
      const res = await fetch('/api/admin/ai/post-ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 5, language: lang }) });
      const data = await res.json() as { ideas: typeof ideas; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setIdeas(data.ideas ?? []);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-2">Suggests 5 fresh blog post ideas based on your recent content.</p>
      <div className="flex gap-2 items-center">
        <select value={lang} onChange={e => setLang(e.target.value)} className="bg-bg-0 border border-border rounded-[var(--radius-md)] px-2 py-1.5 text-sm text-text-0 focus:outline-none focus:border-matrix/50">
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="ar">Arabic</option>
        </select>
        <button onClick={run} disabled={running} className="flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-50 transition-colors">
          {running ? <Loader2 size={14} className="animate-spin" /> : <Lightbulb size={14} />}
          {running ? 'Thinking…' : 'Generate ideas'}
        </button>
      </div>
      {ideas.length > 0 && (
        <div className="space-y-2 mt-1">
          {ideas.map((idea, i) => (
            <div key={i} className="flex gap-3 p-3 bg-surface rounded-[var(--radius-md)]">
              <span className="text-xs font-mono text-text-2 shrink-0 mt-0.5">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-0">{idea.title}</p>
                <p className="text-xs text-text-2 mt-0.5">{idea.hook}</p>
                <span className="text-[10px] font-mono text-matrix mt-1 inline-block">{idea.category}</span>
              </div>
              <div className="flex items-start gap-1 shrink-0">
                <CopyButton text={idea.title} />
                <Link
                  href={`/admin/posts/new?title=${encodeURIComponent(idea.title)}`}
                  className="p-1.5 text-text-2 hover:text-matrix transition-colors text-xs"
                  title="Create post"
                >
                  ✍
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tool: Newsletter draft ────────────────────────────────────────────────────
function NewsletterDraftTool() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; previewText: string; htmlBody: string } | null>(null);
  const [lang, setLang] = useState('en');

  const run = async () => {
    setRunning(true);
    setDraft(null);
    try {
      const res = await fetch('/api/admin/ai/newsletter-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: lang }) });
      const data = await res.json() as { draft: typeof draft; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setDraft(data.draft);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-2">Generates a newsletter draft from your 3 most recent published posts. Review and edit before sending.</p>
      <div className="flex gap-2 items-center">
        <select value={lang} onChange={e => setLang(e.target.value)} className="bg-bg-0 border border-border rounded-[var(--radius-md)] px-2 py-1.5 text-sm text-text-0 focus:outline-none focus:border-matrix/50">
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="ar">Arabic</option>
        </select>
        <button onClick={run} disabled={running} className="flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-50 transition-colors">
          {running ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          {running ? 'Drafting…' : 'Draft from latest posts'}
        </button>
      </div>
      {draft && (
        <div className="space-y-3 mt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-text-2">Subject</label>
              <CopyButton text={draft.subject} />
            </div>
            <p className="text-sm text-text-0 bg-surface px-3 py-2 rounded-[var(--radius-md)]">{draft.subject}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-text-2">Preview text</label>
              <CopyButton text={draft.previewText} />
            </div>
            <p className="text-xs text-text-1 bg-surface px-3 py-2 rounded-[var(--radius-md)]">{draft.previewText}</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-text-2">HTML body</label>
              <CopyButton text={draft.htmlBody} />
            </div>
            <pre className="text-xs font-mono text-text-2 bg-surface px-3 py-2 rounded-[var(--radius-md)] overflow-x-auto whitespace-pre-wrap max-h-48">{draft.htmlBody}</pre>
          </div>
          <Link
            href={`/admin/newsletter`}
            className="inline-flex items-center gap-1.5 text-xs text-matrix hover:underline"
          >
            Open Newsletter → paste and send
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Tool: SEO Doctor ──────────────────────────────────────────────────────────
function SEODoctorTool() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [postId, setPostId] = useState('');
  const [result, setResult] = useState<{ score: number; issues: string[]; suggestions: string[]; metaDescription?: string; suggestedTags?: string[] } | null>(null);
  const [postTitle, setPostTitle] = useState('');

  const run = async () => {
    if (!postId.trim()) { toast('Enter a post ID or slug', 'error'); return; }
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/ai/seo-doctor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: postId.trim() }) });
      const data = await res.json() as { result: typeof result; post?: { title: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setResult(data.result);
      setPostTitle(data.post?.title ?? '');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  const scoreColor = result ? (result.score >= 70 ? 'text-matrix' : result.score >= 50 ? 'text-warning' : 'text-danger') : '';

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-2">Analyze a post for SEO issues and get actionable suggestions.</p>
      <div className="flex gap-2">
        <input
          value={postId}
          onChange={e => setPostId(e.target.value)}
          placeholder="Post ID or slug"
          className="flex-1 bg-bg-0 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 focus:outline-none focus:border-matrix/50 font-mono"
        />
        <button onClick={run} disabled={running} className="flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-50 transition-colors whitespace-nowrap">
          {running ? <Loader2 size={14} className="animate-spin" /> : <Stethoscope size={14} />}
          {running ? 'Analyzing…' : 'Run SEO check'}
        </button>
      </div>
      {result && (
        <div className="space-y-3 mt-1">
          {postTitle && <p className="text-xs text-text-2">Analyzing: <span className="text-text-1">{postTitle}</span></p>}
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-display font-bold ${scoreColor}`}>{result.score}</span>
            <span className="text-xs text-text-2">/ 100 SEO score</span>
          </div>
          {result.issues.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-danger mb-1.5">Issues</p>
              <ul className="space-y-1">{result.issues.map((issue, i) => <li key={i} className="text-xs text-text-2 flex gap-1.5"><span className="text-danger shrink-0">✗</span>{issue}</li>)}</ul>
            </div>
          )}
          {result.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-matrix mb-1.5">Suggestions</p>
              <ul className="space-y-1">{result.suggestions.map((s, i) => <li key={i} className="text-xs text-text-2 flex gap-1.5"><span className="text-matrix shrink-0">→</span>{s}</li>)}</ul>
            </div>
          )}
          {result.metaDescription && (
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-xs text-text-2 mb-1">Suggested meta description</p>
                <p className="text-xs text-text-1 bg-surface px-2 py-1.5 rounded">{result.metaDescription}</p>
              </div>
              <CopyButton text={result.metaDescription} />
            </div>
          )}
          {result.suggestedTags && result.suggestedTags.length > 0 && (
            <div>
              <p className="text-xs text-text-2 mb-1">Suggested tags</p>
              <div className="flex flex-wrap gap-1">
                {result.suggestedTags.map((tag, i) => (
                  <span key={i} className="text-[11px] font-mono bg-surface border border-border text-text-1 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tool: Translation gaps ────────────────────────────────────────────────────
function TranslationGapsTool() {
  const [loading, setLoading] = useState(false);
  const [gaps, setGaps] = useState<{ _id: string; title: string; slug: string; views: number; missingLangs: string[] }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai/translation-gaps');
      const data = await res.json() as { gaps: typeof gaps };
      setGaps(data.gaps ?? []);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const FLAG: Record<string, string> = { fr: '🇫🇷', ar: '🇸🇦' };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-2">Finds English posts that are missing French or Arabic translations. No AI cost — pure database query.</p>
      {!loaded ? (
        <button onClick={run} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-50 transition-colors">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Languages size={14} />}
          {loading ? 'Scanning…' : 'Find gaps'}
        </button>
      ) : gaps.length === 0 ? (
        <p className="text-sm text-matrix">All posts are fully translated! 🎉</p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs text-text-2">{gaps.length} posts need translations:</p>
          {gaps.map(gap => (
            <div key={gap._id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
              <Link
                href={`/admin/posts/${gap._id}`}
                className="flex-1 text-sm text-text-0 hover:text-matrix transition-colors truncate"
              >
                {gap.title}
              </Link>
              <span className="text-xs text-text-2 shrink-0">{gap.views} views</span>
              <div className="flex gap-1 shrink-0">
                {gap.missingLangs.map(l => (
                  <span key={l} className="text-[10px] font-mono bg-warning/10 text-warning px-1.5 py-0.5 rounded uppercase">
                    {FLAG[l]} {l}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIToolsPage() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/ai-settings').then(r => r.json()).then((d: Record<string, string | null>) => {
      setHasKey(!!d.ai_openrouter_key);
    }).catch(() => setHasKey(false));
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <span className="font-mono text-xs text-matrix tracking-[0.15em]">// ai-tools</span>
        <h1 className="font-display font-bold text-2xl text-text-0 mt-1">AI Tools</h1>
        <p className="text-sm text-text-2 mt-1">One-button agentic helpers. All manual-trigger — nothing runs automatically.</p>
      </div>

      {hasKey === false && (
        <div className="glass border border-warning/30 rounded-[var(--radius-lg)] px-4 py-3 text-sm text-warning flex items-center gap-2">
          ⚠ OpenRouter key not configured.{' '}
          <Link href="/rk-studio/settings/ai" className="underline hover:text-warning/80">Set it in AI Settings →</Link>
        </div>
      )}

      <div className="space-y-3">
        <ToolCard
          icon={ImageIcon}
          title="Auto Alt Text"
          description="Generate alt text for images missing descriptions (max 20 per run)"
          model="gemini-flash-1.5"
        >
          <AltTextTool />
        </ToolCard>

        <ToolCard
          icon={Lightbulb}
          title="Post Ideas"
          description="Get 5 fresh blog post ideas based on your recent content"
          model="kimi-k2"
        >
          <PostIdeasTool />
        </ToolCard>

        <ToolCard
          icon={Mail}
          title="Newsletter Draft"
          description="Draft a newsletter from your 3 most recent published posts"
          model="kimi-k2"
        >
          <NewsletterDraftTool />
        </ToolCard>

        <ToolCard
          icon={Stethoscope}
          title="SEO Doctor"
          description="Analyze a post for SEO issues and get improvement suggestions"
          model="llama-3.1-8b"
        >
          <SEODoctorTool />
        </ToolCard>

        <ToolCard
          icon={Languages}
          title="Translation Gaps"
          description="Find English posts missing French or Arabic translations"
          model="db-query (free)"
        >
          <TranslationGapsTool />
        </ToolCard>
      </div>
    </div>
  );
}
