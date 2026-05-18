'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface InlineDeleteConfirmProps {
  /** Callback invoked when the user confirms deletion */
  onConfirm: () => void;
  /** Accessible label for the initial delete button (e.g. `Delete "My Post"`) */
  label?: string;
  /** If true, the confirm state is shown immediately (controlled mode) */
  disabled?: boolean;
}

/**
 * Replaces native confirm() with an inline two-step confirmation.
 *
 * First click → shows "Cancel / Delete?" inline.
 * Second click → fires onConfirm.
 * Click anywhere else / Cancel → resets.
 */
export default function InlineDeleteConfirm({ onConfirm, label = 'Delete', disabled }: InlineDeleteConfirmProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-150">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-2 py-1 text-[11px] font-mono text-text-2 glass border border-border rounded-[var(--radius-sm)] hover:text-text-0 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => { setConfirming(false); onConfirm(); }}
          className="px-2 py-1 text-[11px] font-mono text-danger border border-danger/30 bg-danger/10 rounded-[var(--radius-sm)] hover:bg-danger/20 transition-colors"
        >
          Delete?
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="text-text-2 hover:text-danger transition-colors duration-[var(--duration-fast)] disabled:opacity-40"
    >
      <Trash2 size={14} aria-hidden />
    </button>
  );
}
