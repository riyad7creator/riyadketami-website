'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react';

export type ToastState = 'publishing' | 'translating' | 'done' | 'partial';

export interface Toast {
  state: ToastState;
  message: string;
}

interface ToastBannerProps {
  toast: Toast | null;
  onDismiss?: () => void;
}

const ICON: Record<ToastState, React.ReactNode> = {
  publishing:  <Loader2 size={14} className="animate-spin shrink-0 text-text-2" />,
  translating: <Loader2 size={14} className="animate-spin shrink-0 text-matrix" />,
  done:        <CheckCircle2 size={14} className="shrink-0 text-matrix" />,
  partial:     <AlertTriangle size={14} className="shrink-0 text-yellow-400" />,
};

const CLS: Record<ToastState, string> = {
  publishing:  'border-border bg-bg-1',
  translating: 'border-matrix/30 bg-matrix/[0.06]',
  done:        'border-matrix/40 bg-matrix/[0.08]',
  partial:     'border-yellow-400/30 bg-yellow-400/[0.06]',
};

export default function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border text-sm ${CLS[toast.state]}`}
        >
          {ICON[toast.state]}
          <span className="flex-1 text-text-1">{toast.message}</span>
          {onDismiss && (
            <button onClick={onDismiss} className="text-text-2 hover:text-text-1 transition-colors duration-[var(--duration-fast)]">
              <X size={13} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
