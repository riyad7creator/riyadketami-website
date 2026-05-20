'use client';

import { useState, useRef } from 'react';
import { X, Sparkles, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AIWriterPanelProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  postTitle?: string;
  language?: string;
}

export default function AIWriterPanel({ open, onClose, onInsert, postTitle, language = 'en' }: AIWriterPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    if (streaming) {
      abortRef.current?.abort();
      setStreaming(false);
      return;
    }

    setStreaming(true);
    setOutput('');
    setError('');
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: postTitle, prompt: prompt || undefined, language }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const err = await res.json() as { error?: string };
        setError(err.error ?? 'Generation failed.');
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const chunk = JSON.parse(raw) as { choices?: { delta?: { content?: string } }[] };
            const text = chunk.choices?.[0]?.delta?.content ?? '';
            accumulated += text;
            setOutput(accumulated);
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError('Network error. Check your connection.');
      }
    } finally {
      setStreaming(false);
    }
  };

  const handleInsert = () => {
    if (!output) return;
    onInsert(output);
    setOutput('');
    setPrompt('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-bg-0/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col border-l border-border bg-bg-0 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <span className="font-mono text-xs text-matrix tracking-[0.15em]">// ai-writer</span>
                <h2 className="font-display font-bold text-lg text-text-0 mt-0.5 flex items-center gap-2">
                  <Sparkles size={16} className="text-matrix" /> AI Writer
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-5">
              {/* Prompt */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-text-2">
                  Prompt <span className="text-text-2/60">(optional — leave blank to use post title)</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder={`e.g. "Write about AI tools for startup founders" or leave blank to use "${postTitle ?? 'post title'}"`}
                  className="w-full bg-bg-1 border border-border rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-0 placeholder:text-text-2 focus:outline-none focus:border-matrix/50 resize-none transition-colors duration-[var(--duration-fast)]"
                />
              </div>

              {/* Generate button */}
              <button
                type="button"
                onClick={() => void generate()}
                disabled={!streaming && !postTitle && !prompt}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 disabled:opacity-40 transition-colors duration-[var(--duration-fast)]"
              >
                {streaming ? (
                  <><Loader2 size={14} className="animate-spin" /> Stop generating</>
                ) : (
                  <><Send size={14} /> Generate</>
                )}
              </button>

              {error && <p className="text-xs text-danger">{error}</p>}

              {/* Output preview */}
              {output && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-text-2">Preview</span>
                  <div
                    className="min-h-[200px] bg-bg-1 border border-border rounded-[var(--radius-md)] p-4 prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:text-text-0 prose-p:text-text-1 prose-a:text-matrix prose-code:text-matrix overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: output }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            {output && (
              <div className="shrink-0 border-t border-border px-5 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleInsert}
                  className="flex-1 px-4 py-2.5 bg-matrix text-bg-0 text-sm font-semibold rounded-[var(--radius-md)] hover:bg-matrix/90 transition-colors duration-[var(--duration-fast)]"
                >
                  Insert into editor
                </button>
                <button
                  type="button"
                  onClick={() => { setOutput(''); setPrompt(''); }}
                  className="px-4 py-2.5 glass border border-border text-text-1 text-sm rounded-[var(--radius-md)] hover:border-border-hover transition-colors duration-[var(--duration-fast)]"
                >
                  Clear
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
