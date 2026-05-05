'use client';

import { ToastProvider, useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';

function Buttons() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" size="sm" onClick={() => toast('Operation successful!', 'success')}>
        Success toast
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast('Something went wrong.', 'error')}>
        Error toast
      </Button>
      <Button variant="secondary" size="sm" onClick={() => toast('Here is some information.', 'info')}>
        Info toast
      </Button>
    </div>
  );
}

export default function ToastDemo() {
  return (
    <ToastProvider>
      <Buttons />
    </ToastProvider>
  );
}
