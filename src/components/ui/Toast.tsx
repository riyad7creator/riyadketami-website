'use client';

import { Toaster, toast as sonnerToast } from 'sonner';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

/**
 * Sonner provides stack rearrangement, hover-pause, swipe-to-dismiss, and
 * screen-reader announcements. This module keeps the original
 * `useToast()` / `toast(message, type)` call-site API as a thin adapter.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        theme="dark"
        gap={8}
        icons={{
          success: <CheckCircle size={16} className="text-matrix" />,
          error: <AlertCircle size={16} className="text-danger" />,
          info: <Info size={16} className="text-accent" />,
        }}
        toastOptions={{
          classNames: {
            toast:
              'glass !bg-surface !border !border-border !rounded-[var(--radius-md)] !shadow-lg !text-sm !gap-3',
            title: '!text-text-0 !font-normal',
            description: '!text-text-2',
            success: '!border-matrix/30',
            error: '!border-danger/30',
            info: '!border-accent/30',
            closeButton: '!bg-bg-1 !border-border !text-text-2 hover:!text-text-0',
          },
        }}
        closeButton
      />
    </>
  );
}

export function useToast() {
  return {
    toast: (message: string, type: ToastType = 'info') => {
      if (type === 'success') sonnerToast.success(message);
      else if (type === 'error') sonnerToast.error(message);
      else sonnerToast.info(message);
    },
  };
}
