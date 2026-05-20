'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormField, Button } from '@/components/ui';
import { contactFormSchema } from '@/lib/validation';
import type { z } from 'zod';

type FormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  labels: {
    name: string;
    email: string;
    subject: string;
    message: string;
    budget: string;
    submit: string;
    success: string;
    error: string;
  };
}

export default function ContactForm({ labels }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    const parsed = contactFormSchema.safeParse(data);
    if (!parsed.success) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <p
        role="status"
        aria-live="polite"
        className="font-mono text-sm text-matrix tracking-[0.15em] py-8"
      >
        {labels.success}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <FormField
          label={labels.name}
          required
          placeholder="Riyad Ketami"
          error={errors.name?.message}
          {...register('name')}
        />
        <FormField
          label={labels.email}
          type="email"
          required
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>
      <FormField
        label={labels.subject}
        required
        placeholder="What's this about?"
        error={errors.subject?.message}
        {...register('subject')}
      />
      <FormField
        label={labels.message}
        as="textarea"
        rows={6}
        required
        placeholder="Tell me what you're working on..."
        error={errors.message?.message}
        {...register('message')}
      />
      <FormField
        label={labels.budget}
        placeholder="e.g. $5k–$10k"
        error={errors.budget?.message}
        {...register('budget')}
      />

      {status === 'error' && (
        <p className="text-sm text-danger">{labels.error}</p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={status === 'submitting'}
        className="w-full"
      >
        {status === 'submitting' ? '...' : labels.submit}
      </Button>
    </form>
  );
}
