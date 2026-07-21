import type { ComponentPropsWithoutRef, ReactNode } from 'react';

interface FormFieldProps extends ComponentPropsWithoutRef<'input'> {
  label?: string;
  error?: string;
  hint?: string;
  as?: 'input' | 'textarea' | 'select';
  rows?: number;
  children?: ReactNode;
}

const inputBase =
  'w-full bg-surface border border-border rounded-[var(--radius-md)] px-4 py-2.5 text-text-0 placeholder:text-text-1 text-sm transition-colors duration-[var(--duration-fast)] focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 disabled:opacity-50';

export default function FormField({
  label,
  error,
  hint,
  as = 'input',
  rows = 4,
  className = '',
  children,
  id,
  ...props
}: FormFieldProps) {
  const fieldId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-text-1">
          {label}
          {props.required && <span className="text-matrix ms-1">*</span>}
        </label>
      )}

      {as === 'textarea' ? (
        <textarea
          id={fieldId}
          rows={rows}
          className={`${inputBase} resize-none ${error ? 'border-danger/60 focus:border-danger/60 focus:ring-danger/20' : ''} ${className}`}
          {...(props as ComponentPropsWithoutRef<'textarea'>)}
        />
      ) : as === 'select' ? (
        <select
          id={fieldId}
          className={`${inputBase} ${error ? 'border-danger/60' : ''} ${className}`}
          {...(props as ComponentPropsWithoutRef<'select'>)}
        >
          {children}
        </select>
      ) : (
        <input
          id={fieldId}
          className={`${inputBase} ${error ? 'border-danger/60 focus:border-danger/60 focus:ring-danger/20' : ''} ${className}`}
          {...props}
        />
      )}

      {(error || hint) && (
        <p className={`text-xs ${error ? 'text-danger' : 'text-text-1'}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
