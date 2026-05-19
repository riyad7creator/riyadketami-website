interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className = '',
}: SectionHeaderProps) {
  const center = align === 'center';

  return (
    <div className={`flex flex-col gap-3 ${center ? 'items-center text-center' : ''} ${className}`}>
      {eyebrow && (
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-matrix">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-text-0">
        {title}
      </h2>
      {subtitle && (
        <p className="text-text-1 text-lg leading-phi measure">
          {subtitle}
        </p>
      )}
    </div>
  );
}
