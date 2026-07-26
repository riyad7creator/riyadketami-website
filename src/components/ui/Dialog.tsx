'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Radix supplies focus trap, focus return, scroll lock, Esc handling, and
 * inerting of background content. Framer Motion supplies the enter/exit —
 * exit is deliberately quicker than enter (leaving should beat arriving).
 */
export default function Dialog({ open, onClose, title, children, size = 'md', className = '' }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[var(--z-modal)] bg-bg-0/80 backdrop-blur-sm"
              />
            </RadixDialog.Overlay>

            <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 pointer-events-none">
              <RadixDialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`pointer-events-auto relative glass border border-border rounded-[var(--radius-lg)] w-full ${sizes[size]} shadow-2xl focus:outline-none ${className}`}
                >
                  <div className="flex items-start justify-between gap-4 p-6 border-b border-border">
                    {title ? (
                      <RadixDialog.Title className="text-lg font-semibold text-text-0">
                        {title}
                      </RadixDialog.Title>
                    ) : (
                      <RadixDialog.Title className="sr-only">Dialog</RadixDialog.Title>
                    )}
                    <RadixDialog.Close
                      aria-label="Close dialog"
                      className="ms-auto text-text-2 hover:text-text-0 transition-colors p-1 rounded-[var(--radius-sm)] hover:bg-surface"
                    >
                      <X size={16} />
                    </RadixDialog.Close>
                  </div>
                  <div className="p-6">{children}</div>
                </motion.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
