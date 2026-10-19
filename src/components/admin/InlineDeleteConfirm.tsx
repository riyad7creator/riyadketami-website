'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
 * First click shows "Delete? / Cancel" inline; a click on "Delete?" fires onConfirm.
 * Cancel sits where the trash icon was and "Delete?" ignores clicks for a
 * moment after opening, so a double click on the icon never deletes.
 */
const ARM_DELAY_MS = 400;

export default function InlineDeleteConfirm({ onConfirm, label = 'Delete', disabled }: InlineDeleteConfirmProps) {
  const [confirming, setConfirming] = useState(false);
  const openedAt = useRef(0);

  if (confirming) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-1"
      >
        <button
          type="button"
          onClick={() => {
            if (Date.now() - openedAt.current < ARM_DELAY_MS) return;
            setConfirming(false);
            onConfirm();
          }}
          className="px-2 py-1 text-[11px] font-mono text-danger border border-danger/30 bg-danger/10 rounded-[var(--radius-sm)] hover:bg-danger/20 transition-colors"
        >
          Delete?
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="px-2 py-1 text-[11px] font-mono text-text-2 glass border border-border rounded-[var(--radius-sm)] hover:text-text-0 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => { openedAt.current = Date.now(); setConfirming(true); }}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="text-text-2 hover:text-danger transition-colors duration-[var(--duration-fast)] disabled:opacity-40"
    >
      <Trash2 size={14} aria-hidden />
    </button>
  );
}
