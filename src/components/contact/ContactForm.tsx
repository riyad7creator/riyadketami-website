'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
    placeholders: { name: string; email: string; subject: string; message: string; budget: string };
    validation: {
      required: string; min2: string; min5: string; min10: string;
      max50: string; max100: string; max1000: string; email: string;
    };
  };
}

export default function ContactForm({ labels }: ContactFormProps) {
  const p = labels.placeholders;
  const v = labels.validation;
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
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        role="status"
        aria-live="polite"
        className="font-mono text-sm text-matrix tracking-[0.15em] py-8"
      >
        {labels.success}
      </motion.p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <FormField
          label={labels.name}
          required
          placeholder={p.name}
          error={errors.name?.message}
          {...register('name', { required: v.required, minLength: { value: 2, message: v.min2 }, maxLength: { value: 50, message: v.max50 } })}
        />
        <FormField
          label={labels.email}
          type="email"
          required
          placeholder={p.email}
          error={errors.email?.message}
          {...register('email', { required: v.required, pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: v.email } })}
        />
      </div>
      <FormField
        label={labels.subject}
        required
        placeholder={p.subject}
        error={errors.subject?.message}
        {...register('subject', { required: v.required, minLength: { value: 5, message: v.min5 }, maxLength: { value: 100, message: v.max100 } })}
      />
      <FormField
        label={labels.message}
        as="textarea"
        rows={6}
        required
        placeholder={p.message}
        error={errors.message?.message}
        {...register('message', { required: v.required, minLength: { value: 10, message: v.min10 }, maxLength: { value: 1000, message: v.max1000 } })}
      />
      <FormField
        label={labels.budget}
        placeholder={p.budget}
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
