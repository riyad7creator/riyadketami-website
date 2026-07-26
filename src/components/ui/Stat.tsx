import Counter from './Counter';

interface StatProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
  className?: string;
}

export default function Stat({ value, suffix, prefix, label, decimals, className = '' }: StatProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-4xl sm:text-5xl font-bold font-display tracking-tight text-text-0 tabular-nums">
        <Counter value={value} suffix={suffix} prefix={prefix} decimals={decimals} />
      </span>
      <span className="text-sm text-text-2 uppercase tracking-widest font-mono">{label}</span>
    </div>
  );
}
